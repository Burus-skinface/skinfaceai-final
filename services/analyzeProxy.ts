/**
 * Shared client for the secure /api/analyze backend proxy.
 * Production / Capacitor: set VITE_API_BASE_URL (e.g. https://api.skinface.ai).
 * Local Vite: leave unset — relative /api uses the Vite proxy to localhost:3003.
 */

import { supabase } from './supabase';

const DEFAULT_TIMEOUT_MS = 60_000;

function analyzeUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (!base) return '/api/analyze';
  // Supabase Edge Function host: .../functions/v1 → /analyze
  if (base.includes('/functions/v1')) {
    return base.endsWith('/analyze') ? base : `${base}/analyze`;
  }
  // Express (or similar): host root → /api/analyze
  return `${base}/api/analyze`;
}

export async function callAnalyzeProxy<T = Record<string, unknown>>(
  prompt: string,
  schema: unknown,
  options?: { timeoutMs?: number; model?: string }
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* guest — no session */
    }

    const response = await fetch(analyzeUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        schema,
        ...(options?.model ? { model: options.model } : {}),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('DAILY_LIMIT_REACHED');
      }
      throw new Error(`Server error: ${response.statusText}`);
    }

    const responseData = await response.json();
    if (responseData?.text && typeof responseData.text === 'string') {
      return JSON.parse(responseData.text) as T;
    }
    return responseData as T;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}
