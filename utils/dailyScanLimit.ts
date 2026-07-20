/**
 * Free users: 1 completed scan per local calendar day.
 * PRO (unlimitedScans): no limit.
 */

const KEY = 'skinface_last_scan_day_v1';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function hasUsedFreeScanToday(): boolean {
  try {
    return localStorage.getItem(KEY) === todayKey();
  } catch {
    return false;
  }
}

export function markFreeScanUsedToday(): void {
  try {
    localStorage.setItem(KEY, todayKey());
  } catch {
    /* ignore */
  }
}

export function clearFreeScanDayMarker(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Returns true if the user may start a new scan. */
export function canStartScan(unlimitedScans: boolean): boolean {
  if (unlimitedScans) return true;
  return !hasUsedFreeScanToday();
}
