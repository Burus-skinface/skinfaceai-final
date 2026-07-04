import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getReferralStats,
  shareReferralLink,
  REFERRAL_CONSTANTS,
  type ReferralStats,
} from '../services/referralService';
import { localized } from '../localization';

interface ReferralCardProps {
  userId: string;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ userId }) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared' | 'failed'>('idle');
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    setLoading(true);
    const data = await getReferralStats(userId);
    setStats(data);
    setLoading(false);

    // Show celebration if premium just became active
    if (data.isPremiumActive) {
      const celebrated = localStorage.getItem(`referral_celebrated_${userId}`);
      if (!celebrated) {
        setShowCelebration(true);
        localStorage.setItem(`referral_celebrated_${userId}`, 'true');
      }
    }
  };

  const handleShare = async () => {
    if (!stats?.referralCode) return;
    const result = await shareReferralLink(stats.referralCode);
    setShareStatus(result);
    if (result === 'copied') {
      setTimeout(() => setShareStatus('idle'), 2500);
    }
  };

  const { REFERRALS_NEEDED, PREMIUM_DAYS_REWARD } = REFERRAL_CONSTANTS;

  // Progress calculation
  const progressInCycle = stats ? (stats.completedReferrals % REFERRALS_NEEDED) : 0;
  const progressPercent = (progressInCycle / REFERRALS_NEEDED) * 100;

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 mb-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/10" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-white/10 rounded mb-2" />
            <div className="h-3 w-48 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-2 bg-white/5 rounded-full" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full border border-black/5 text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-black tracking-wider">PRO</div>
              <h2 className="text-2xl font-bold text-[#1D1D1F] mb-2">{localized('Plan unlocked', 'Plan kilidi açıldı')}</h2>
              <p className="text-[#86868B] text-sm mb-6">
                {localized(
                  `${REFERRALS_NEEDED} friends completed their first scan. Your ${PREMIUM_DAYS_REWARD}-day plan access is active.`,
                  `${REFERRALS_NEEDED} arkadaş ilk ölçümünü tamamladı. ${PREMIUM_DAYS_REWARD} günlük plan erişimin aktif.`
                )}
              </p>
              <button
                onClick={() => setShowCelebration(false)}
                className="w-full py-3 bg-[#1D1D1F] text-white font-bold rounded-xl active:scale-95 transition-transform"
              >
                {localized('Continue', 'Devam et')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Card */}
      <div className="rounded-3xl bg-white border border-black/[0.04] p-5 mb-5 overflow-hidden relative shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {/* Subtle glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start gap-3 mb-4 relative">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[11px] font-black tracking-wider text-purple-700 flex-shrink-0">
            PRO
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#1D1D1F] leading-tight">
              {localized('Invite friends, unlock the plan', 'Arkadaş çağır, planı aç')}
            </h3>
            <p className="text-xs text-[#86868B] mt-0.5 leading-relaxed">
              {localized(
                `${REFERRALS_NEEDED} friends complete their first scan and you get ${PREMIUM_DAYS_REWARD} days of plan access.`,
                `${REFERRALS_NEEDED} arkadaş ilk ölçümünü tamamlasın, ${PREMIUM_DAYS_REWARD} gün plan erişimi kazan.`
              )}
            </p>
          </div>
        </div>

        {/* Active Premium Badge */}
        {stats.isPremiumActive && stats.premiumExpiresAt && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-green-700">
              {localized('Premium active', 'Premium aktif')} — {new Date(stats.premiumExpiresAt).toLocaleDateString()}
            </span>
          </motion.div>
        )}

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#86868B] font-medium">{localized('Progress to next reward', 'Sonraki ödüle ilerleme')}</span>
            <span className="text-xs font-bold text-purple-400">
              {progressInCycle}/{REFERRALS_NEEDED}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2.5 bg-black/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #9333ea, #6366f1, #8b5cf6)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Milestone dots */}
            {Array.from({ length: REFERRALS_NEEDED }).map((_, i) => (
              <div
                key={i}
                className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  i < progressInCycle ? 'bg-white/80' : 'bg-black/15'
                }`}
                style={{ left: `${((i + 1) / REFERRALS_NEEDED) * 100 - 1}%` }}
              />
            ))}
          </div>

          {/* Milestone text */}
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-600">0</span>
            <span className="text-[10px] text-purple-400/60 flex items-center gap-0.5">
              {localized('Goal', 'Hedef')} {REFERRALS_NEEDED}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-black/[0.03] rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-[#1D1D1F]">{stats.totalReferred}</p>
            <p className="text-[10px] text-[#86868B] font-medium">{localized('Invited', 'Davet')}</p>
          </div>
          <div className="bg-black/[0.03] rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-purple-400">{stats.completedReferrals}</p>
            <p className="text-[10px] text-[#86868B] font-medium">{localized('Scanned', 'Taradı')}</p>
          </div>
          <div className="bg-black/[0.03] rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-green-400">{stats.totalPremiumDays}d</p>
            <p className="text-[10px] text-[#86868B] font-medium">{localized('Earned', 'Kazanım')}</p>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 relative overflow-hidden"
          style={{
            background: shareStatus === 'copied'
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : 'linear-gradient(135deg, #9333ea, #6366f1)',
          }}
        >
          {shareStatus === 'copied' ? (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 text-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {localized('Invite link copied', 'Davet linki kopyalandı')}
            </motion.span>
          ) : shareStatus === 'shared' ? (
            <span className="text-white">{localized('Invite shared', 'Davet paylaşıldı')}</span>
          ) : (
            <span className="flex items-center gap-1.5 text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {localized('Invite friends', 'Arkadaşlarını davet et')}
            </span>
          )}
        </button>

        {/* Referral Code display */}
        {stats.referralCode && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-[10px] text-[#86868B]">{localized('Your code:', 'Kodun:')}</span>
            <span className="text-[11px] font-mono font-bold text-purple-400/70 bg-purple-500/10 px-2 py-0.5 rounded-md">
              {stats.referralCode}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default ReferralCard;
