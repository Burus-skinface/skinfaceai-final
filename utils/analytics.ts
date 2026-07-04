/** Lightweight analytics hook — wire to PostHog/Mixpanel when ready. */
export type AnalyticsEvent =
  | 'scan_started'
  | 'scan_completed'
  | 'pipeline_partial'
  | 'referral_shared'
  | 'paywall_viewed';

export function trackEvent(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, props ?? {});
  }
}
