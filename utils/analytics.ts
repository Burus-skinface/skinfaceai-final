/** Analytics — PostHog when VITE_POSTHOG_KEY is set; always logs in DEV. */

export type AnalyticsEvent =
  | 'onboarding_complete'
  | 'scan_started'
  | 'scan_completed'
  | 'pipeline_partial'
  | 'referral_shared'
  | 'referral_captured'
  | 'paywall_viewed'
  | 'purchase_started'
  | 'purchase_success'
  | 'purchase_restore'
  | 'auth_success'
  | 'notif_prompt_shown'
  | 'notif_enabled';

let posthog: { capture: (e: string, p?: Record<string, unknown>) => void } | null = null;
let initStarted = false;

export async function initAnalytics(): Promise<void> {
  if (initStarted) return;
  initStarted = true;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;
  try {
    const mod = await import('posthog-js');
    const ph = mod.default;
    ph.init(key, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: false,
      persistence: 'localStorage',
    });
    posthog = ph;
  } catch (e) {
    console.warn('[analytics] PostHog init failed', e);
  }
}

export function trackEvent(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, props ?? {});
  }
  try {
    posthog?.capture(event, props);
  } catch {
    /* ignore */
  }
}
