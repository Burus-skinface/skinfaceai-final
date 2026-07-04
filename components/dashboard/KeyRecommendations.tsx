import React from 'react';
import { localized, translateDynamicNote } from '../../localization';
import type { DailyReport } from '../../types';

const PremiumAIStarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
    <defs>
      <linearGradient id="premium-ai-star-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFFFF" />
        <stop offset="0.5" stopColor="#E0C3FC" />
        <stop offset="1" stopColor="#8EC5FC" />
      </linearGradient>
    </defs>
    <path fill="url(#premium-ai-star-grad)" fillOpacity="0.2" stroke="url(#premium-ai-star-grad)" strokeWidth="1.5" strokeLinejoin="round" d="m10 7l-.516 1.394c-.676 1.828-1.014 2.742-1.681 3.409s-1.581 1.005-3.409 1.681L3 14l1.394.516c1.828.676 2.742 1.015 3.409 1.681s1.005 1.581 1.681 3.409L10 21l.516-1.394c.676-1.828 1.015-2.742 1.681-3.409s1.581-1.005 3.409-1.681L17 14l-1.394-.516c-1.828-.676-2.742-1.014-3.409-1.681s-1.005-1.581-1.681-3.409zm8-4l-.221.597c-.29.784-.435 1.176-.72 1.461c-.286.286-.678.431-1.462.72L15 6l.598.221c.783.29 1.175.435 1.46.72c.286.286.431.678.72 1.462L18 9l.221-.597c.29-.784.435-1.176.72-1.461c.286-.286.678-.431 1.462-.72L21 6l-.598-.221c-.783-.29-1.175-.435-1.46-.72c-.286-.286-.431-.678-.72-1.462z" />
  </svg>
);

interface KeyRecommendationsProps {
  data: DailyReport;
  isFreeUser?: boolean;
  onShowPaywall?: () => void;
  onNavigateToRecommendations?: () => void;
}

function getRecommendationConfig(area: string, why: string, actions: string[]) {
  const cleanArea = area.toLowerCase();
  
  // Choose description: first action if available, or why explanation
  const defaultDescEn = actions?.[0] || why || '';
  const desc = defaultDescEn;

  // 1. Hydration
  if (
    cleanArea.includes('hydrat') ||
    cleanArea.includes('nem') ||
    cleanArea.includes('fatigue') ||
    cleanArea.includes('water') ||
    cleanArea.includes('dry') ||
    cleanArea.includes('circle')
  ) {
    return {
      title: localized('Improve hydration', 'Nemlendirmeyi artırın'),
      desc: desc || localized('Drink more water & use HA serum', 'Daha fazla su için ve HA serumu kullanın'),
      icon: (
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#3B82F6]/10 flex items-center justify-center shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <defs>
              <linearGradient id="rec-hydr-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#009EE0" />
              </linearGradient>
            </defs>
            <path fill="url(#rec-hydr-grad)" fillOpacity="0.15" stroke="url(#rec-hydr-grad)" strokeWidth="1.5" d="M3.5 13.678c0-4.184 3.58-8.319 6.094-10.706a3.463 3.463 0 0 1 4.812 0C16.919 5.36 20.5 9.494 20.5 13.678C20.5 17.78 17.281 22 12 22s-8.5-4.22-8.5-8.322Z" />
            <path stroke="url(#rec-hydr-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M16 14a4 4 0 0 1-4 4" fill="none" />
          </svg>
        </div>
      ),
    };
  }

  // 2. Texture & Smoothness
  if (
    cleanArea.includes('texture') ||
    cleanArea.includes('doku') ||
    cleanArea.includes('smooth') ||
    cleanArea.includes('rough')
  ) {
    return {
      title: localized('Improve texture', 'Dokuyu iyileştirin'),
      desc: desc || localized('Use gentle exfoliation 2x/week', 'Haftada 2 kez nazik peeling uygulayın'),
      icon: (
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#F5F3FF] border border-[#A855F7]/10 flex items-center justify-center shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <defs>
              <linearGradient id="rec-text-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A855F7" />
                <stop offset="1" stopColor="#6366F1" />
              </linearGradient>
            </defs>
            {/* Using hugeicons:treatment for skincare scrub/exfoliate */}
            <path fill="url(#rec-text-grad)" fillOpacity="0.15" stroke="url(#rec-text-grad)" strokeWidth="1.5" d="M8 7.839c0-2.092 1.896-4.16 3.226-5.353a1.91 1.91 0 0 1 2.548 0C15.104 3.68 17 5.746 17 7.84C17 9.89 15.296 12 12.5 12S8 9.89 8 7.839Z" />
            <path fill="none" stroke="url(#rec-text-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 14h2.395c.294 0 .584.066.847.194l2.042.988c.263.127.553.193.848.193h1.042c1.008 0 1.826.791 1.826 1.767c0 .04-.027.074-.066.085l-2.541.703a1.95 1.95 0 0 1-1.368-.124L6.842 16.75" />
            <path fill="none" stroke="url(#rec-text-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="m13 16.5l4.593-1.411a1.985 1.985 0 0 1 2.204.753c.369.51.219 1.242-.319 1.552l-7.515 4.337a2 2 0 0 1-1.568.187L4 20.02" />
          </svg>
        </div>
      ),
    };
  }

  // 3. Barrier & Sun Protection
  if (
    cleanArea.includes('barrier') ||
    cleanArea.includes('bariyer') ||
    cleanArea.includes('sun') ||
    cleanArea.includes('spf') ||
    cleanArea.includes('protect') ||
    cleanArea.includes('inflammation') ||
    cleanArea.includes('redness')
  ) {
    return {
      title: localized('Protect skin barrier', 'Cilt bariyerini koruyun'),
      desc: desc || localized('Use SPF every morning', 'Her sabah güneş kremi kullanın'),
      icon: (
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/10 flex items-center justify-center shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <defs>
              <linearGradient id="rec-barr-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10B981" />
                <stop offset="1" stopColor="#059669" />
              </linearGradient>
            </defs>
            <path fill="url(#rec-barr-grad)" fillOpacity="0.15" stroke="url(#rec-barr-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M18.709 3.495C16.817 2.554 14.5 2 12 2s-4.816.554-6.709 1.495c-.928.462-1.392.693-1.841 1.419S3 6.342 3 7.748v3.49c0 5.683 4.542 8.842 7.173 10.196c.734.377 1.1.566 1.827.566s1.093-.189 1.827-.566C16.457 20.08 21 16.92 21 11.237V7.748c0-1.406 0-2.108-.45-2.834s-.913-.957-1.841-1.419" />
          </svg>
        </div>
      ),
    };
  }

  // 4. Pores & Congestion
  if (
    cleanArea.includes('pore') ||
    cleanArea.includes('gözenek') ||
    cleanArea.includes('congestion') ||
    cleanArea.includes('blackhead')
  ) {
    return {
      title: localized('Minimize pores', 'Gözenekleri sıkılaştırın'),
      desc: desc || localized('Use Niacinamide & BHA serum', 'Niasinamid ve BHA serumu kullanın'),
      icon: (
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B]/10 flex items-center justify-center shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <defs>
              <linearGradient id="rec-pores-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F59E0B" />
                <stop offset="1" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <path fill="url(#rec-pores-grad)" fillOpacity="0.15" stroke="url(#rec-pores-grad)" strokeWidth="1.5" strokeLinecap="round" d="M15.131 2.5A10 10 0 0 0 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10a10 10 0 0 0-.458-3" />
            <path stroke="url(#rec-pores-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M17 12a5 5 0 1 1-5-5" fill="none" />
            <path stroke="url(#rec-pores-grad)" strokeWidth="1.5" strokeLinecap="round" d="M19.5 4.5L12 12m7.5-7.5V2m0 2.5H22" fill="none" />
          </svg>
        </div>
      ),
    };
  }

  // 5. Acne & Breakouts
  if (
    cleanArea.includes('acne') ||
    cleanArea.includes('akne') ||
    cleanArea.includes('sivilce') ||
    cleanArea.includes('breakout') ||
    cleanArea.includes('pimple')
  ) {
    return {
      title: localized('Clear breakouts', 'Sivilceleri giderin'),
      desc: desc || localized('Apply Salicylic Acid spot treatment', 'Salisilik asit lokal leke tedavisi uygulayın'),
      icon: (
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#EF4444]/10 flex items-center justify-center shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <defs>
              <linearGradient id="rec-acne-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EF4444" />
                <stop offset="1" stopColor="#B91C1C" />
              </linearGradient>
            </defs>
            <circle fill="url(#rec-acne-grad)" fillOpacity="0.15" stroke="url(#rec-acne-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" cx="12" cy="12" r="10" />
            <path fill="none" stroke="url(#rec-acne-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m.125 3.75H12m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0" />
          </svg>
        </div>
      ),
    };
  }

  // 6. Tone, Pigmentation & Radiance
  if (
    cleanArea.includes('tone') ||
    cleanArea.includes('ton') ||
    cleanArea.includes('pigment') ||
    cleanArea.includes('dull') ||
    cleanArea.includes('radiance') ||
    cleanArea.includes('glow')
  ) {
    return {
      title: localized('Even skin tone', 'Cilt tonunu eşitleyin'),
      desc: desc || localized('Use Vitamin C & Alpha Arbutin', 'C Vitamini ve Alfa Arbutin kullanın'),
      icon: (
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#FDF2F8] border border-[#EC4899]/10 flex items-center justify-center shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <defs>
              <linearGradient id="rec-tone-grad" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EC4899" />
                <stop offset="0.5" stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <path fill="url(#rec-tone-grad)" fillOpacity="0.15" stroke="url(#rec-tone-grad)" strokeWidth="1.5" strokeLinecap="round" d="m13.926 12.778l-2.149-2.149c-.292-.293-.439-.439-.597-.517a1.07 1.07 0 0 0-.954 0c-.158.078-.304.224-.597.517s-.439.44-.517.597c-.15.3.15.654 0 .954c.078.158.224.305.517.598l2.149 2.148m2.148-2.149l6.445 6.446c.293.292.439.439.517.597c.15.3.15.653 0 .954c-.078.157-.224.304-.517.597s-.44.439-.597.517c-.301.15-.654.15-.954 0c-.158-.078-.305-.224-.598-.517l-6.445-6.445m2.149-2.149l-2.149 2.149" />
            <path stroke="url(#rec-tone-grad)" strokeWidth="1.5" d="m17 2l.295.797c.386 1.044.58 1.566.96 1.947c.382.381.904.575 1.948.961L21 6l-.797.295c-1.044.386-1.566.58-1.947.96c-.381.382-.575.904-.961 1.948L17 10l-.295-.797c-.386-1.044-.58-1.566-.96-1.947c-.382-.381-.904-.575-1.948-.961L13 6l.797-.295c1.044-.386 1.566-.58 1.947-.96c.381-.382.575-.904.961-1.948z" fill="none" />
            <path stroke="url(#rec-tone-grad)" strokeWidth="1.5" d="M6 4l.221.597c.29.784.435 1.176.72 1.461c.286.286.678.431 1.462.72L9 7l-.597.221c-.784.29-1.176.435-1.461.72c-.286.286-.431.678-.72 1.462L6 10l-.221-.597c-.29-.784-.435-1.176-.72-1.461c-.286-.286-.678-.431-1.462-.72L3 7l.597-.221c.784-.29 1.176-.435 1.461-.72c.286-.286.431-.678.72-1.462z" fill="none" />
          </svg>
        </div>
      ),
    };
  }

  // Default fallback
  return {
    title: area.charAt(0).toUpperCase() + area.slice(1),
    desc: desc,
    icon: (
      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#F3F4F6] border border-gray-200 flex items-center justify-center shadow-sm">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <defs>
            <linearGradient id="rec-def-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6B7280" />
              <stop offset="1" stopColor="#374151" />
            </linearGradient>
          </defs>
          <path fill="url(#rec-def-grad)" fillOpacity="0.15" stroke="url(#rec-def-grad)" strokeWidth="1.5" strokeLinejoin="round" d="m15 2l.539 2.392a5.39 5.39 0 0 0 4.07 4.07L22 9l-2.392.539a5.39 5.39 0 0 0-4.07 4.07L15 16l-.539-2.392a5.39 5.39 0 0 0-4.07-4.07L8 9l2.392-.539a5.39 5.39 0 0 0 4.07-4.07zM7 12l.385 1.708a3.85 3.85 0 0 0 2.907 2.907L12 17l-1.708.385a3.85 3.85 0 0 0-2.907 2.907L7 22l-.385-1.708a3.85 3.85 0 0 0-2.907-2.907L2 17l1.708-.385a3.85 3.85 0 0 0 2.907-2.907z" />
        </svg>
      </div>
    ),
  };
}

const KeyRecommendations: React.FC<KeyRecommendationsProps> = ({
  data,
  isFreeUser = true,
  onShowPaywall,
  onNavigateToRecommendations,
}) => {
  const handleAction = () => {
    if (isFreeUser) {
      onShowPaywall?.();
    } else {
      onNavigateToRecommendations?.();
    }
  };

  const rawFocusAreas = data?.recommendations?.focusAreas;
  const focusAreasList =
    Array.isArray(rawFocusAreas) && rawFocusAreas.length > 0
      ? rawFocusAreas.slice(0, 3)
      : [
          {
            area: 'hydration',
            why: localized(
              'Drink more water & use HA serum',
              'Daha fazla su için ve HA serumu kullanın'
            ),
            actions: [],
            timeline: '',
          },
          {
            area: 'texture',
            why: localized(
              'Use gentle exfoliation 2x/week',
              'Haftada 2 kez nazik peeling uygulayın'
            ),
            actions: [],
            timeline: '',
          },
          {
            area: 'barrier',
            why: localized(
              'Use SPF every morning',
              'Her sabah güneş kremi kullanın'
            ),
            actions: [],
            timeline: '',
          },
        ];

  const score = data?.scoring?.globalScore ?? data?.global_score;
  const getDevAIAssessment = (sVal: number | null) => {
    const s = sVal ?? 7.2;
    if (s >= 8.5) {
      return localized(
        'Your skin is in excellent condition! Maintaining this state with consistent hydration and SPF is key. You are close to your maximum potential.',
        'Cildiniz mükemmel durumda! Bu seviyeyi korumak için düzenli nemlendirme ve SPF kullanımı anahtardır. Maksimum potansiyelinize çok yakınsınız.'
      );
    }
    if (s >= 7.0) {
      return localized(
        'Your skin is in good condition, but resolving 2-3 key focus areas can push you to the Top 10% of users. Focus on improving skin texture and barrier defense.',
        'Cildiniz iyi durumda, ancak 2-3 kilit odak alanını çözmek sizi en iyi %10 kullanıcı dilimine yükseltebilir. Cilt dokusu ve bariyer korumasına odaklanın.'
      );
    }
    if (s >= 5.5) {
      return localized(
        'Your skin is stable, but there is noticeable room for improvement. Prioritizing sebum balance and hydration will significantly boost your overall score.',
        'Cildiniz stabil ancak belirgin gelişim alanı var. Sebum dengesi ve nemlendirmeye öncelik vermek genel skorunuzu önemli ölçüde artıracaktır.'
      );
    }
    return localized(
      'Your skin requires active care. Focusing on acne clarity and rebuilding your skin barrier is recommended to prevent irritation and breakouts.',
      'Cildinizin aktif bakıma ihtiyacı var. Hassasiyet ve sivilcelenmeyi önlemek için akne berraklığına ve cilt bariyerini onarmaya odaklanmanız önerilir.'
    );
  };

  const rawAssessment = data?.recommendations?.motivationalNote || data?.daily_note || getDevAIAssessment(score);
  const assessmentText = translateDynamicNote(rawAssessment);

  return (
    <section className="w-full mb-6">
      {/* Overall Assessment Card */}
      <div className="w-full mb-4 bg-white rounded-2xl p-4 border border-black/[0.04] shadow-[0_2px_12px_rgba(46,47,114,0.06)] flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D1E3D] to-[#7E4CA8] flex items-center justify-center text-white shrink-0">
            <PremiumAIStarIcon />
          </div>
          <h2 className="font-bold text-[#2D1E3D] text-[15px] tracking-tight">
            {localized('Overall Assessment', 'Genel Değerlendirme')}
          </h2>
        </div>
        <p className="text-[#464650] leading-relaxed text-[13.5px] font-medium">
          {assessmentText}
        </p>
      </div>

      {/* Recommendations Header */}
      <div className="flex items-center justify-between mb-3 px-0.5 mt-6">
        <h2 className="text-[17px] font-semibold text-[#1b1c1c]">
          {localized('Key Recommendations', 'Önemli Öneriler')}
        </h2>
        <span className="text-[10px] font-bold text-[#777681] uppercase tracking-wider">
          {localized('Personalized', 'Kişisel')}
        </span>
      </div>

      {/* Grid Items */}
      <div className="space-y-3">
        {focusAreasList.map((item, idx) => {
          const config = getRecommendationConfig(
            item.area,
            item.why,
            item.actions
          );
          return (
            <div
              key={idx}
              onClick={handleAction}
              className="w-full bg-white rounded-2xl p-4 border border-black/[0.04] shadow-[0_2px_12px_rgba(46,47,114,0.06)] flex gap-4 items-center hover:scale-[0.99] active:scale-[0.98] transition-all cursor-pointer"
            >
              {config.icon}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#1b1c1c] text-[14.5px] leading-tight">
                  {config.title}
                </h4>
                <p className="text-[#777681] text-xs mt-1 leading-snug truncate">
                  {config.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* See Detailed Plan Button */}
      <div className="mt-4">
        <button
          type="button"
          onClick={handleAction}
          className="w-full bg-gradient-to-r from-[#2D1E3D] to-[#7E4CA8] hover:opacity-95 active:scale-[0.98] text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(45,30,61,0.15)] transition-all cursor-pointer"
        >
          <span>{localized('See Detailed Plan', 'Detaylı Planı Gör')}</span>
          <span className="material-symbols-outlined text-lg" data-icon="arrow_forward">
            arrow_forward
          </span>
        </button>
      </div>
    </section>
  );
};

export default KeyRecommendations;
