/**
 * Referral Service
 *
 * Handles referral tracking, premium rewards, and referral code management.
 * Uses Supabase for persistent storage and localStorage for pending referral codes.
 *
 * Flow:
 * 1. User A shares referral link → ?ref=CODE
 * 2. User B opens link → code saved to localStorage
 * 3. User B signs up → referral record created in Supabase (scan not yet credited)
 * 4. User B's first authenticated scans INSERT → DB trigger marks complete + grants rewards
 * 5. When User A has 5 completed referrals → 3 days premium granted (server-side)
 */

import { supabase } from './supabase';

// ─── Constants ─────────────────────────────────────────────
const REFERRALS_NEEDED = 5;
const PREMIUM_DAYS_REWARD = 3;
const PENDING_REFERRAL_KEY = 'pending_referral_code';

// ─── Types ─────────────────────────────────────────────────
export interface ReferralStats {
  referralCode: string;
  totalReferred: number;        // Total signups via link
  completedReferrals: number;   // Those who completed a scan
  rewardsEarned: number;        // Number of times reward was granted
  totalPremiumDays: number;     // Total premium days earned
  nextRewardAt: number;         // How many more needed for next reward
  isPremiumActive: boolean;
  premiumExpiresAt: string | null;
}

export interface PremiumStatus {
  isActive: boolean;
  expiresAt: string | null;
  remainingHours: number;
  source: 'referral' | 'subscription' | 'none';
}

// ─── Referral Code Generation ──────────────────────────────

/**
 * Generate a unique referral code.
 * Uses cryptographically secure random values to prevent brute-forcing.
 */
export function generateReferralCode(_userId: string): string {
  const array = new Uint8Array(4); // 4 bytes = 8 hex chars
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Get or create referral code for a user.
 * Checks Supabase first, creates if not found.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  try {
    // Check if user already has a referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (profile?.referral_code) {
      return profile.referral_code;
    }

    // Generate and save new code
    const code = generateReferralCode(userId);
    await supabase
      .from('profiles')
      .update({ referral_code: code })
      .eq('id', userId);

    return code;
  } catch (err) {
    console.error('Failed to get/create referral code:', err);
    // Fallback: generate locally
    return generateReferralCode(userId);
  }
}

// ─── Pending Referral (localStorage) ───────────────────────

/**
 * Save a referral code from URL to localStorage.
 * Called when user opens app with ?ref=CODE
 */
export function savePendingReferral(code: string): void {
  localStorage.setItem(PENDING_REFERRAL_KEY, code);
  console.log('📎 Saved pending referral code:', code);
}

/**
 * Get and clear the pending referral code.
 */
export function consumePendingReferral(): string | null {
  const code = localStorage.getItem(PENDING_REFERRAL_KEY);
  if (code) {
    localStorage.removeItem(PENDING_REFERRAL_KEY);
  }
  return code;
}

/**
 * Check if there's a pending referral.
 */
export function hasPendingReferral(): boolean {
  return !!localStorage.getItem(PENDING_REFERRAL_KEY);
}

// ─── Referral Tracking (Supabase) ──────────────────────────

/**
 * When a new user signs up, link them to the referrer.
 * Scan completion + premium grants are handled by DB trigger on scans INSERT.
 */
export async function trackReferralSignup(newUserId: string): Promise<void> {
  const referralCode = consumePendingReferral();
  if (!referralCode) return;

  try {
    // Find the referrer by their code
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .single();

    if (!referrer || referrer.id === newUserId) {
      console.log('❌ Invalid referral: code not found or self-referral');
      return;
    }

    // Create referral record — completion is trigger-only after a real scan
    const { error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: newUserId,
        referred_scan_completed: false,
      });

    if (error) {
      // Likely duplicate — user already has a referrer
      if (error.code === '23505') {
        console.log('ℹ️ User already has a referral record');
      } else {
        console.error('Failed to create referral:', error);
      }
      return;
    }

    // Mark referred_by on the new user's profile
    await supabase
      .from('profiles')
      .update({ referred_by: referralCode })
      .eq('id', newUserId);

    console.log('✅ Referral tracked:', referralCode, '→', newUserId);
  } catch (err) {
    console.error('Referral tracking error:', err);
  }
}

// ─── Stats & Status (read-only) ────────────────────────────

/**
 * Get referral statistics for a user.
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const defaults: ReferralStats = {
    referralCode: '',
    totalReferred: 0,
    completedReferrals: 0,
    rewardsEarned: 0,
    totalPremiumDays: 0,
    nextRewardAt: REFERRALS_NEEDED,
    isPremiumActive: false,
    premiumExpiresAt: null,
  };

  try {
    // Get referral code
    const code = await getOrCreateReferralCode(userId);
    defaults.referralCode = code;

    // Count total referrals
    const { count: totalCount } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', userId);
    defaults.totalReferred = totalCount || 0;

    // Count completed referrals
    const { count: completedCount } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', userId)
      .eq('referred_scan_completed', true);
    defaults.completedReferrals = completedCount || 0;

    // Rewards
    const { data: rewards } = await supabase
      .from('premium_rewards')
      .select('*')
      .eq('user_id', userId)
      .eq('reward_type', 'referral')
      .order('expires_at', { ascending: false });

    if (rewards && rewards.length > 0) {
      defaults.rewardsEarned = rewards.length;
      defaults.totalPremiumDays = rewards.reduce((sum: number, r: any) => sum + (r.days_granted || 0), 0);

      // Check if any premium is still active
      const now = new Date();
      const activeReward = rewards.find((r: any) => new Date(r.expires_at) > now);
      if (activeReward) {
        defaults.isPremiumActive = true;
        defaults.premiumExpiresAt = activeReward.expires_at;
      }
    }

    // Calculate next reward threshold
    const currentProgress = defaults.completedReferrals % REFERRALS_NEEDED;
    defaults.nextRewardAt = REFERRALS_NEEDED - currentProgress;

    return defaults;
  } catch (err) {
    console.error('Get referral stats error:', err);
    return defaults;
  }
}

/**
 * Check if user has active premium from referrals.
 */
export async function getPremiumStatus(userId: string): Promise<PremiumStatus> {
  try {
    const { data: rewards } = await supabase
      .from('premium_rewards')
      .select('expires_at')
      .eq('user_id', userId)
      .order('expires_at', { ascending: false })
      .limit(1);

    if (rewards && rewards.length > 0) {
      const expiresAt = new Date(rewards[0].expires_at);
      const now = new Date();

      if (expiresAt > now) {
        const remainingMs = expiresAt.getTime() - now.getTime();
        return {
          isActive: true,
          expiresAt: rewards[0].expires_at,
          remainingHours: Math.ceil(remainingMs / (1000 * 60 * 60)),
          source: 'referral',
        };
      }
    }

    return {
      isActive: false,
      expiresAt: null,
      remainingHours: 0,
      source: 'none',
    };
  } catch {
    return { isActive: false, expiresAt: null, remainingHours: 0, source: 'none' };
  }
}

/**
 * Generate the full referral link for sharing.
 */
export function getReferralLink(referralCode: string): string {
  const base = import.meta.env.VITE_APP_URL || 'https://skinface.ai';
  return `${base.replace(/\/$/, '')}?ref=${referralCode}`;
}

/**
 * Share referral link using Web Share API (mobile-native) or clipboard.
 */
export async function shareReferralLink(referralCode: string): Promise<'shared' | 'copied' | 'failed'> {
  const link = getReferralLink(referralCode);
  const shareData = {
    title: 'Skinface AI - Free Analysis',
    text: 'Try Skinface AI and get a free skin and face analysis.',
    url: link,
  };

  // Try Web Share API first (works great on mobile)
  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (err) {
      // User cancelled or error — fall through to clipboard
      if ((err as any)?.name === 'AbortError') return 'failed';
    }
  }

  // Fallback: clipboard
  try {
    await navigator.clipboard.writeText(link);
    return 'copied';
  } catch {
    return 'failed';
  }
}

// Export constants for UI
export const REFERRAL_CONSTANTS = {
  REFERRALS_NEEDED,
  PREMIUM_DAYS_REWARD,
};
