// Supabase Edge Function: analyze
// HTTPS Gemini proxy for Capacitor builds (replaces Express /api/analyze in prod).
// Secrets: GEMINI_API_KEY (SUPABASE_* injected automatically)
// verify_jwt: false — guests allowed (soft Bearer check inside)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]);
const MAX_PROMPT_CHARS = 50_000;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    // Soft auth: optional session (rate limits are coarser on edge)
    if (authHeader?.startsWith('Bearer ') && Deno.env.get('SUPABASE_URL') && Deno.env.get('SUPABASE_ANON_KEY')) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } },
      );
      await userClient.auth.getUser();
    }

    const body = await req.json().catch(() => null);
    const prompt = body?.prompt;
    const schema = body?.schema;

    if (!prompt || typeof prompt !== 'string') {
      return json(400, { error: 'Missing prompt' });
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      return json(400, { error: 'Prompt too large' });
    }
    if (schema === undefined) {
      return json(400, { error: 'Missing schema' });
    }

    const requestedModel = typeof body?.model === 'string' ? body.model : 'gemini-2.5-flash';
    if (!ALLOWED_MODELS.has(requestedModel)) {
      return json(400, { error: 'Model not allowed' });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return json(500, { error: 'Server configuration error. GEMINI_API_KEY is missing.' });
    }

    const temperature = typeof body?.temperature === 'number' ? body.temperature : 0;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${requestedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error', geminiRes.status, errText.slice(0, 500));
      return json(500, { error: 'Analysis failed', details: `Gemini ${geminiRes.status}` });
    }

    const geminiJson = await geminiRes.json();
    const text =
      geminiJson?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ||
      '';

    if (!text) {
      return json(500, { error: 'Analysis failed', details: 'Empty model response' });
    }

    return json(200, { text });
  } catch (error) {
    console.error('analyze proxy error', error);
    return json(500, {
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
