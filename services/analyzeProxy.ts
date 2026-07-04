/**
 * Shared client for the secure /api/analyze backend proxy.
 */

const API_ENDPOINT = '/api/analyze';
const DEFAULT_TIMEOUT_MS = 60_000;

export async function callAnalyzeProxy<T = Record<string, unknown>>(
  prompt: string,
  schema: unknown,
  options?: { timeoutMs?: number; model?: string }
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
