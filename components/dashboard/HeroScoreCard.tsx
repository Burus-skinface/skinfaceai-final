import React from 'react';
import { localized } from '../../localization';

interface HeroScoreCardProps {
    score: number | null;
    potential: number | null;
    animatedScore: number;
    onShowPaywall?: () => void;
}

const HeroScoreCard: React.FC<HeroScoreCardProps> = ({
    score,
    potential,
    animatedScore,
    onShowPaywall,
}) => {
    const displayScore = score !== null ? animatedScore : null;
    const displayPotential = potential ?? (score != null ? Math.round(score * 1.12 * 10) / 10 : null);

    const getLabel = (s: number) => {
        if (s >= 8.5) return localized('Excellent', 'Mükemmel');
        if (s >= 7.5) return localized('Good', 'İyi');
        if (s >= 6.5) return localized('Fair', 'Orta');
        if (s >= 5.5) return localized('Needs work', 'Gelişmeli');
        return localized('Priority', 'Öncelik');
    };

    const getScoreBadgeStyles = (s: number) => {
        if (s >= 9.0) return 'bg-[#FBF1D3] text-[#B8860B] ring-1 ring-[#D4AF37]/25';
        if (s >= 7.0) return 'bg-green-500/10 text-green-600 ring-1 ring-green-500/15';
        if (s >= 5.0) return 'bg-[#009EE0]/10 text-[#009EE0] ring-1 ring-[#009EE0]/15';
        return 'bg-red-500/10 text-red-600 ring-1 ring-red-500/15';
    };

    const getScoreColorClass = (s: number) => {
        if (s >= 9.0) return 'text-[#B8860B]';
        if (s >= 7.0) return 'text-green-600';
        if (s >= 5.0) return 'text-[#009EE0]';
        return 'text-red-600';
    };

    return (
        <section className="w-full bg-white rounded-2xl p-5 mb-3 border border-black/[0.04] shadow-[0_4px_20px_rgba(46,47,114,0.08)]">
            <p className="text-[11px] font-bold text-[#777681] uppercase tracking-widest mb-2">
                {localized('Overall Score', 'Genel Skor')}
            </p>
            <div className="flex items-end gap-1">
                <span className={`text-[56px] font-extrabold leading-none tracking-tight tabular-nums ${displayScore != null ? getScoreColorClass(displayScore) : 'text-[#1b1c1c]'}`}>
                    {displayScore != null ? displayScore.toFixed(1) : '—'}
                </span>
                <span className="text-[22px] font-semibold text-[#777681] pb-2">/10</span>
            </div>
            {displayScore != null && (
                <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[13px] font-bold ${getScoreBadgeStyles(displayScore)}`}>
                    {getLabel(displayScore)}
                </span>
            )}

            {displayPotential != null && onShowPaywall && (
                <button
                    type="button"
                    onClick={onShowPaywall}
                    className="w-full mt-4 flex items-center justify-between gap-2 p-3 rounded-xl bg-[#fbf9f9] border border-black/[0.04] text-left active:scale-[0.99] transition-transform"
                >
                    <div>
                        <p className="text-[11px] font-semibold text-[#777681] uppercase tracking-wide">
                            {localized('Your potential', 'Potansiyelin')}
                        </p>
                        <p className="text-[20px] font-extrabold text-[#2e2f72] tabular-nums">
                            {displayPotential.toFixed(1)}
                            <span className="text-[14px] font-semibold text-[#777681]">/10</span>
                        </p>
                    </div>
                    <span className="text-[12px] font-bold text-[#45478b] shrink-0">
                        {localized('Unlock', 'Aç')} →
                    </span>
                </button>
            )}
        </section>
    );
};

export default HeroScoreCard;
