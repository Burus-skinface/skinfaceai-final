import type { ComprehensiveFaceState } from '../services/faceScan/faceState';
import { BIOMETRIC_TTL_MS, PENDING_FACE_TTL_MS } from './biometricRetention';

const PENDING_FACE_KEY = 'pending_face_state_v1';
const THUMBNAIL_KEY = 'scan_thumbnails_v1';

type PendingPayload = {
  savedAt: number;
  faceState: ComprehensiveFaceState;
};

type ThumbEntry = { url: string; savedAt: number };

/** Persist captured face state across OAuth redirect (session-scoped, 30m TTL). */
export function savePendingFaceState(faceState: ComprehensiveFaceState): void {
  try {
    const slim = {
      ...faceState,
      frames: undefined,
    };
    const payload: PendingPayload = {
      savedAt: Date.now(),
      faceState: slim as ComprehensiveFaceState,
    };
    sessionStorage.setItem(PENDING_FACE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[pendingScan] Could not persist face state:', err);
  }
}

export function loadPendingFaceState(): ComprehensiveFaceState | null {
  try {
    const raw = sessionStorage.getItem(PENDING_FACE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Legacy: raw faceState without wrapper
    if (parsed && !('savedAt' in parsed) && parsed.scanId) {
      return parsed as ComprehensiveFaceState;
    }

    const payload = parsed as PendingPayload;
    if (!payload?.faceState || !payload.savedAt) {
      clearPendingFaceState();
      return null;
    }
    if (Date.now() - payload.savedAt > PENDING_FACE_TTL_MS) {
      clearPendingFaceState();
      return null;
    }
    return payload.faceState;
  } catch {
    clearPendingFaceState();
    return null;
  }
}

export function clearPendingFaceState(): void {
  sessionStorage.removeItem(PENDING_FACE_KEY);
}

function readThumbMap(): Record<string, ThumbEntry> {
  try {
    const raw = JSON.parse(localStorage.getItem(THUMBNAIL_KEY) || '{}');
    // Migrate legacy string values → entries with now as savedAt (will expire in 24h)
    const out: Record<string, ThumbEntry> = {};
    for (const [id, val] of Object.entries(raw)) {
      if (typeof val === 'string') {
        out[id] = { url: val, savedAt: Date.now() };
      } else if (val && typeof val === 'object' && 'url' in (val as object)) {
        out[id] = val as ThumbEntry;
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Purge thumbnail entries older than 24h. */
export function purgeExpiredThumbnails(now = Date.now()): void {
  try {
    const map = readThumbMap();
    let changed = false;
    for (const id of Object.keys(map)) {
      if (now - map[id].savedAt > BIOMETRIC_TTL_MS) {
        delete map[id];
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(THUMBNAIL_KEY, JSON.stringify(map));
    }
  } catch { /* ignore */ }
}

export function saveScanThumbnail(reportId: string, imageUrl: string | undefined): void {
  if (!imageUrl) return;
  try {
    const map = readThumbMap();
    map[reportId] = { url: imageUrl, savedAt: Date.now() };
    const keys = Object.keys(map).slice(-5);
    const trimmed = Object.fromEntries(keys.map((k) => [k, map[k]]));
    localStorage.setItem(THUMBNAIL_KEY, JSON.stringify(trimmed));
  } catch { /* ignore quota errors */ }
}

export function getScanThumbnail(reportId: string): string | undefined {
  try {
    purgeExpiredThumbnails();
    const map = readThumbMap();
    const entry = map[reportId];
    if (!entry) return undefined;
    if (Date.now() - entry.savedAt > BIOMETRIC_TTL_MS) {
      delete map[reportId];
      localStorage.setItem(THUMBNAIL_KEY, JSON.stringify(map));
      return undefined;
    }
    return entry.url;
  } catch {
    return undefined;
  }
}

export function clearAllScanThumbnails(): void {
  localStorage.removeItem(THUMBNAIL_KEY);
}
