
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = Number(process.env.PORT) || 3003;
const isProd = process.env.NODE_ENV === 'production';

const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]);
const MAX_PROMPT_CHARS = 50_000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3002',
  'https://skinface.ai',
  'https://www.skinface.ai',
  'capacitor://localhost',
  'http://localhost',
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Dev/staging tunnels only outside production
    if (!isProd && (origin.includes('ngrok-free.app') || origin.includes('ngrok.io'))) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy violation'), false);
  },
  methods: ['POST'],
}));

app.use(express.json({ limit: '256kb' }));

/** Soft auth: verify Supabase HS256 JWT when secret is configured. */
function attachAuth(req, _res, next) {
  req.authUserId = null;
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  const token = header.slice(7).trim();
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    // Soft mode: accept presence of Bearer without crypto verify (dev)
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64url').toString('utf8'));
      if (payload?.sub && (!payload.exp || payload.exp * 1000 > Date.now())) {
        req.authUserId = payload.sub;
      }
    } catch {
      /* ignore */
    }
    return next();
  }

  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return next();
    const data = `${h}.${p}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64url');
    const a = Buffer.from(expected);
    const b = Buffer.from(s);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return next();
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    if (payload?.sub && (!payload.exp || payload.exp * 1000 > Date.now())) {
      req.authUserId = payload.sub;
    }
  } catch {
    /* treat as guest */
  }
  next();
}

const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: (req) => (req.authUserId ? 20 : 5),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes',
  },
});

import { getDashboardData } from './controllers/faceStratController.js';

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/dashboard', getDashboardData);

app.post('/api/analyze', attachAuth, analyzeLimiter, async (req, res) => {
  try {
    const { prompt, schema } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' });
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      return res.status(400).json({ error: 'Prompt too large' });
    }
    if (schema === undefined) {
      return res.status(400).json({ error: 'Missing schema' });
    }

    const requestedModel = typeof req.body.model === 'string' ? req.body.model : 'gemini-2.5-flash';
    if (!ALLOWED_MODELS.has(requestedModel)) {
      return res.status(400).json({ error: 'Model not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('API Key missing in server environment');
      return res.status(500).json({ error: 'Server configuration error. GEMINI_API_KEY is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Only accept prompt + schema — ignore freeform contents / arbitrary payloads
    const response = await ai.models.generateContent({
      model: requestedModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: typeof req.body.temperature === 'number' ? req.body.temperature : 0,
      },
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Security Proxy running on http://localhost:${PORT}`);
  console.log(`Rate Limit: 5 guest / 20 auth requests per 15 min per IP`);
});
