/** Default hero scan portrait (Figma / Stitch reference) */
export const DEFAULT_HERO_SCAN_IMAGE = '/images/hero-scan-default.png';

export function resolveScanImageUrl(scanUrl?: string | null): string {
  if (scanUrl && scanUrl.trim().length > 0) return scanUrl;
  return DEFAULT_HERO_SCAN_IMAGE;
}
