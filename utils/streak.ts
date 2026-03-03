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














