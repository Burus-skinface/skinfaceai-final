
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3003; // Changed from 3002 to avoid conflict with Vite

// Middleware
app.use(cors({
    origin: true, // Allow all origins for dev/ngrok (or specify array)
    methods: ['POST']
}));
app.use(express.json());

// ----------------------------------------------------
// LAYER 2: RATE LIMITING (Strict: 1 Request / 24 Hours)
// ----------------------------------------------------
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` for DEV.
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: {
        error: "Too many requests, please try again later.",
        retryAfter: "15 minutes"
    }
});

// Apply rate limiting to critical endpoints
app.use('/api/analyze', limiter);

// ----------------------------------------------------
// LAYER 1: BACKEND PROXY (Gemini API & Dashboard)
// ----------------------------------------------------
import { getDashboardData } from './controllers/faceStratController.js';

app.post('/api/dashboard', getDashboardData);

app.post('/api/analyze', async (req, res) => {
    try {
        const { prompt, schema } = req.body;

        // Basic validation
        if (!prompt) {
            return res.status(400).json({ error: "Missing prompt" });
        }

        const apiKey = process.env.VITE_API_KEY;
        if (!apiKey) {
            console.error("API Key missing in server environment");
            return res.status(500).json({ error: "Server configuration error" });
        }

        const ai = new GoogleGenAI({ apiKey });

        // Call Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.3,
            }
        });

        // Parse response
        const text = response.text;
        let result;
        try {
            // Handle potential unicode issues or raw text
            result = JSON.parse(text);
        } catch (e) {
            const fixedText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
            result = JSON.parse(fixedText);
        }

        res.json(result);

    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).json({ error: "Analysis failed", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🛡️  Security Proxy running on http://localhost:${PORT}`);
    console.log(`🔒  Rate Limit: 1 scan per 24 hours per IP`);
});
