import type { DailyReport } from '../types';
import type { ComprehensiveFaceState } from '../services/faceScan/faceState';

export const BIOMETRIC_TTL_MS = 24 * 60 * 60 * 1000;
export const PENDING_FACE_TTL_MS = 30 * 60 * 1000;

const IMAGE_FACE_KEYS = [
  'primaryImageJpegBase64',
  'leftAngleImageJpegBase64',
  'rightAngleImageJpegBase64',
  'retainedCropJpegBase64',
] as const;

/** Strip face images from faceState; keep geometry / metrics. */
export function stripFaceStateImages(
  faceState: ComprehensiveFaceState | undefined | null
): ComprehensiveFaceState | undefined {
  if (!faceState) return undefined;
  const next: any = { ...faceState };
  for (const key of IMAGE_FACE_KEYS) {
    if (key in next) next[key] = undefined;
  }
  return next as ComprehensiveFaceState;
}

/** Keep scores/analysis/recommendations; remove biometric images. */
export function stripBiometrics(report: DailyReport): DailyReport {
  return {
    ...report,
    imageUrl: undefined as unknown as string,
    faceState: stripFaceStateImages(report.faceState),
  };
}

export function isBiometricExpired(dateIso: string, now = Date.now()): boolean {
  const t = new Date(dateIso).getTime();
  if (Number.isNaN(t)) return true;
  return now - t > BIOMETRIC_TTL_MS;
}

export function purgeExpiredBiometrics(
  history: DailyReport[],
  now = Date.now()
): DailyReport[] {
  return history.map((r) => (isBiometricExpired(r.date, now) ? stripBiometrics(r) : r));
}

/** Payload for Supabase update when purging cloud biometrics. */
export function cloudBiometricPurgePayload(faceState: unknown): {
  image_url: null;
  face_state: unknown;
} {
  return {
    image_url: null,
    face_state: stripFaceStateImages(faceState as ComprehensiveFaceState) ?? null,
  };
}
