/**
 * Daily Glow Up progress — routine step completion + water counter.
 * Persisted per-day in localStorage; keys older than today are pruned lazily.
 */

export interface GlowUpDayProgress {
  morning: boolean[];
  evening: boolean[];
  water: number;
}

export const WATER_GOAL = 8;

const KEY_PREFIX = 'glowup_progress_';

function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${KEY_PREFIX}${d.getFullYear()}-${mm}-${dd}`;
}

function pruneOldKeys(currentKey: string) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX) && key !== currentKey) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore storage errors
  }
}

export function getDayProgress(morningLen: number, eveningLen: number): GlowUpDayProgress {
  const key = todayKey();
  pruneOldKeys(key);
  let stored: Partial<GlowUpDayProgress> = {};
  try {
    const raw = localStorage.getItem(key);
    if (raw) stored = JSON.parse(raw);
  } catch {
    // corrupt entry — start fresh
  }
  const normalize = (arr: unknown, len: number): boolean[] => {
    const src = Array.isArray(arr) ? arr : [];
    return Array.from({ length: len }, (_, i) => src[i] === true);
  };
  return {
    morning: normalize(stored.morning, morningLen),
    evening: normalize(stored.evening, eveningLen),
    water: typeof stored.water === 'number' && stored.water >= 0 ? stored.water : 0,
  };
}

export function saveDayProgress(progress: GlowUpDayProgress) {
  try {
    localStorage.setItem(todayKey(), JSON.stringify(progress));
  } catch {
    // ignore storage errors
  }
}

export function completedCount(steps: boolean[]): number {
  return steps.filter(Boolean).length;
}

/** Overall completion percent across both routines (0-100). */
export function overallPercent(progress: GlowUpDayProgress): number {
  const total = progress.morning.length + progress.evening.length;
  if (total === 0) return 0;
  const done = completedCount(progress.morning) + completedCount(progress.evening);
  return Math.round((done / total) * 100);
}

export interface TransformationPoint {
  days: number;
  gain: number; // cumulative score gain, e.g. +0.3
}

/**
 * Split the current → potential score gap into 7 / 21 / 60 day milestones.
 * Deterministic; gains are cumulative and capped to one decimal.
 */
export function expectedTransformation(current: number | null, potential: number | null): TransformationPoint[] {
  const gap = current != null && potential != null ? Math.max(0, potential - current) : 0.5;
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return [
    { days: 7, gain: round1(Math.max(0.1, gap * 0.2)) },
    { days: 21, gain: round1(Math.max(0.2, gap * 0.55)) },
    { days: 60, gain: round1(Math.max(0.3, gap)) },
  ];
}
