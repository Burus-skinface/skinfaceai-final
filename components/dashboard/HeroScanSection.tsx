import React, { useState } from 'react';
import { localized } from '../../localization';
import { resolveScanImageUrl } from './constants';

interface HeroScanSectionProps {
  imageUrl?: string | null;
  score: number | null;
  animatedScore: number;
  /** Figma "Top 28% of users" — show when percentile data exists */
  topPercentile?: number | null;
}

const HeroScanSection: React.FC<HeroScanSectionProps> = ({
  imageUrl,
  score,
  animatedScore,
  topPercentile,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  
  // If we have a mock report or no custom image, use the beautiful downloaded portrait
  const isMock = imageUrl?.includes('hero-scan-default.png') || !imageUrl;
  const src = isMock ? '/images/sofia_portrait.png' : resolveScanImageUrl(imageUrl);
  const displayScore = score !== null ? animatedScore : null;

  const getLabel = (s: number) => {
    if (s >= 8.5) return localized('Excellent', 'Mükemmel');
    if (s >= 7.5) return localized('Good', 'İyi');
    if (s >= 6.5) return localized('Fair', 'Orta');
    if (s >= 5.5) return localized('Needs work', 'Gelişmeli');
    return localized('Priority', 'Öncelik');
  };

  const getScoreColorClass = (s: number) => {
    if (s >= 9.0) return 'text-[#B8860B]';
    if (s >= 7.0) return 'text-green-600';
    if (s >= 5.0) return 'text-[#009EE0]';
    return 'text-red-600';
  };

  const showTopChip = topPercentile != null && topPercentile > 0 && topPercentile <= 50;

  return (
    <section className="bg-white rounded-3xl p-6 ambient-shadow relative overflow-hidden flex justify-between items-center w-full mb-4">
      {/* Score info on the left */}
      <div className="z-10 flex flex-col justify-center">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[17px] font-semibold text-[#1b1c1c]">
            {localized('Overall Score', 'Genel Skor')}
          </span>
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors focus:outline-none"
            aria-label={localized('Show calculation details', 'Hesaplama detaylarını göster')}
          >
            <span className="material-symbols-outlined text-[16px] text-[#777681]" data-icon="info">
              info
            </span>
          </button>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className={`text-[52px] font-extrabold tracking-[-0.04em] leading-none ${displayScore != null ? getScoreColorClass(displayScore) : 'text-[#1b1c1c]'}`}>
            {displayScore != null ? displayScore.toFixed(1) : '—'}
          </span>
          <span className="text-[20px] font-semibold text-[#c7c5d2]">/10</span>
        </div>
        <p className={`font-semibold mb-4 text-[15px] leading-tight ${displayScore != null ? getScoreColorClass(displayScore) : 'text-[#777681]'}`}>
          {displayScore != null ? getLabel(displayScore) : '—'}
        </p>
        
        {showTopChip && (
          <div className="inline-flex items-center gap-1 bg-black/[0.04] px-2.5 py-1 rounded-full w-fit">
            <span className="material-symbols-outlined text-[15px] text-[#a311ae]" data-icon="trending_up">
              trending_up
            </span>
            <span className="text-[10px] font-bold tracking-[0.05em] uppercase text-[#1b1c1c]">
              {localized('Top', 'İlk')} {topPercentile}% {localized('of users', 'kullanıcı')}
            </span>
          </div>
        )}
      </div>

      {/* Portrait image sticking out on the right */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 flex justify-end items-end pointer-events-none select-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c0c1ff]/20 to-[#f86dfd]/10 rounded-l-full blur-xl transform translate-x-8 scale-150" />
        <img
          alt={localized('Your scan', 'Taraman')}
          className="h-[120%] object-cover object-center relative z-10 translate-y-4 right-[-10%]"
          src={src}
          draggable={false}
        />
      </div>

      {/* Tooltip explanation overlay */}
      {showInfo && (
        <div className="absolute inset-x-5 top-5 bottom-5 z-20 bg-white/95 backdrop-blur-md border border-black/10 rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col justify-center animate-fade-in-up">
          <div>
            <div className="flex justify-between items-center mb-1.5 font-bold text-[#2e2f72] text-[13px]">
              <span>{localized('Overall Score Calculation', 'Genel Skor Nasıl Hesaplanır?')}</span>
              <button 
                type="button"
                onClick={() => setShowInfo(false)} 
                className="material-symbols-outlined text-[16px] text-[#777681] hover:text-[#1b1c1c] p-0.5"
                aria-label={localized('Close', 'Kapat')}
              >
                close
              </button>
            </div>
            <p className="text-[11px] text-[#464650] leading-relaxed">
              {localized(
                'Your overall score is calculated based on your skin health score (Skin Score) and your facial structure analysis (Face Score).',
                'Genel skorunuz; cilt sağlığı skorunuz (Cilt Skoru) ve yüz yapısı analizinizin (Yüz Skoru) birleştirilmesiyle hesaplanır.'
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroScanSection;
