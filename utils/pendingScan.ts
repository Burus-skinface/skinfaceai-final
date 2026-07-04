import type { ComprehensiveFaceState } from '../services/faceScan/faceState';

const PENDING_FACE_KEY = 'pending_face_state_v1';

/** Persist captured face state across OAuth redirect (session-scoped). */
export function savePendingFaceState(faceState: ComprehensiveFaceState): void {
  try {
    const slim = {
      ...faceState,
      frames: undefined,
    };
    sessionStorage.setItem(PENDING_FACE_KEY, JSON.stringify(slim));
  } catch (err) {
    console.warn('[pendingScan] Could not persist face state:', err);
  }
}

export function loadPendingFaceState(): ComprehensiveFaceState | null {
  try {
    const raw = sessionStorage.getItem(PENDING_FACE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ComprehensiveFaceState;
  } catch {
    return null;
  }
}

export function clearPendingFaceState(): void {
  sessionStorage.removeItem(PENDING_FACE_KEY);
}

const THUMBNAIL_KEY = 'scan_thumbnails_v1';

export function saveScanThumbnail(reportId: string, imageUrl: string | undefined): void {
  if (!imageUrl) return;
  try {
    const map = JSON.parse(localStorage.getItem(THUMBNAIL_KEY) || '{}') as Record<string, string>;
    map[reportId] = imageUrl;
    const keys = Object.keys(map).slice(-5);
    const trimmed = Object.fromEntries(keys.map((k) => [k, map[k]]));
    localStorage.setItem(THUMBNAIL_KEY, JSON.stringify(trimmed));
  } catch { /* ignore quota errors */ }
}

export function getScanThumbnail(reportId: string): string | undefined {
  try {
    const map = JSON.parse(localStorage.getItem(THUMBNAIL_KEY) || '{}') as Record<string, string>;
    return map[reportId];
  } catch {
    return undefined;
  }
}
