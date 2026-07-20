/**
 * Streak Management System
 * Tracks daily usage streaks for gamification
 */

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastScanDate: string | null;
  totalScans: number;
}

const STREAK_STORAGE_KEY = 'facial_analysis_streak';

/**
 * Get current streak data
 */
export function getStreakData(): StreakData {
  try {
    const stored = localStorage.getItem(STREAK_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load streak data:', error);
  }
  
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastScanDate: null,
    totalScans: 0,
  };
}

/**
 * Update streak after scan
 */
export function updateStreak(): StreakData {
  const streak = getStreakData();
  const today = new Date().toDateString();
  
  if (streak.lastScanDate) {
    const lastScan = new Date(streak.lastScanDate).toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (lastScan === today) {
      // Already scanned today, no change
      return streak;
    } else if (lastScan === yesterday) {
      // Continuing streak
      streak.currentStreak += 1;
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    } else {
      // Streak broken
      streak.currentStreak = 1;
    }
  } else {
    // First scan
    streak.currentStreak = 1;
    streak.longestStreak = 1;
  }
  
  streak.lastScanDate = new Date().toISOString();
  streak.totalScans += 1;
  
  saveStreak(streak);
  return streak;
}

/**
 * Save streak data
 */
function saveStreak(streak: StreakData) {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
  } catch (error) {
    console.error('Failed to save streak:', error);
  }
}

/** Push local streak to profiles (best-effort). */
export async function syncStreakToCloud(userId: string): Promise<void> {
  try {
    const { supabase } = await import('../services/supabase');
    const streak = getStreakData();
    await supabase
      .from('profiles')
      .update({
        streak_current: streak.currentStreak,
        streak_longest: streak.longestStreak,
        streak_last_scan: streak.lastScanDate,
        streak_total_scans: streak.totalScans,
      })
      .eq('id', userId);
  } catch (e) {
    console.warn('[STREAK] cloud sync failed', e);
  }
}

/** Hydrate from cloud if local is empty or behind. */
export async function hydrateStreakFromCloud(userId: string): Promise<void> {
  try {
    const { supabase } = await import('../services/supabase');
    const { data } = await supabase
      .from('profiles')
      .select('streak_current, streak_longest, streak_last_scan, streak_total_scans')
      .eq('id', userId)
      .maybeSingle();
    if (!data) return;
    const local = getStreakData();
    const cloudTotal = data.streak_total_scans ?? 0;
    if (cloudTotal > local.totalScans) {
      saveStreak({
        currentStreak: data.streak_current ?? 0,
        longestStreak: data.streak_longest ?? 0,
        lastScanDate: data.streak_last_scan ?? null,
        totalScans: cloudTotal,
      });
    }
  } catch (e) {
    console.warn('[STREAK] hydrate failed', e);
  }
}

/**
 * Get streak badge info
 */
export function getStreakBadge(currentStreak: number): { emoji: string; title: string; color: string } | null {
  if (currentStreak >= 90) {
    return { emoji: '💎', title: 'Diamond Streak', color: 'from-cyan-400 to-blue-600' };
  } else if (currentStreak >= 30) {
    return { emoji: '🥇', title: 'Gold Streak', color: 'from-yellow-400 to-orange-500' };
  } else if (currentStreak >= 14) {
    return { emoji: '🥈', title: 'Silver Streak', color: 'from-gray-300 to-gray-500' };
  } else if (currentStreak >= 7) {
    return { emoji: '🥉', title: 'Bronze Streak', color: 'from-orange-400 to-orange-600' };
  } else if (currentStreak >= 3) {
    return { emoji: '🔥', title: 'On Fire', color: 'from-orange-500 to-red-500' };
  }
  return null;
}

















