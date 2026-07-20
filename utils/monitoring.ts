import * as Sentry from '@sentry/react';
import { initAnalytics } from './analytics';

/** Init PostHog + Sentry once at app boot (no-op if env keys missing). */
export async function initMonitoring(): Promise<void> {
  await initAnalytics();

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      enabled: import.meta.env.PROD,
    });
  } catch (e) {
    console.warn('[monitoring] Sentry init failed', e);
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  try {
    Sentry.captureException(error, { extra: context });
  } catch {
    /* ignore */
  }
}
