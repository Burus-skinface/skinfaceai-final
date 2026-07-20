import React, { useState } from 'react';
import { localized } from '../../localization';

interface SecondaryScoresProps {
    skinScore: number | null;
    skinAge: number | null;
    realAge: number | null;
    previousSkinScore?: number | null;
    useDevDefaults?: boolean;
}

const SecondaryScores: React.FC<SecondaryScoresProps> = ({
    skinScore,
    skinAge,
    realAge,
    previousSkinScore,
    useDevDefaults = false,
}) => {
    const [showSkinInfo, setShowSkinInfo] = useState(false);
    const [showAgeInfo, setShowAgeInfo] = useState(false);
    
    const dSkin = skinScore ?? (useDevDefaults ? 7.2 : null);
    const dSkinAge = skinAge ?? (useDevDefaults ? 24 : null);
    const dRealAge = realAge ?? (useDevDefaults ? 21 : null);
    const ageDiff =
        dSkinAge != null && dRealAge != null ? dSkinAge - dRealAge : null;

    const getSkinLabel = (s: number) =>
        s >= 8.5
            ? localized('Clean signal', 'Temiz sinyal')
            : s >= 7
              ? localized('Good', 'İyi')
              : s >= 5.5
                ? localized('Stable', 'Stabil')
                : localized('Needs focus', 'Odak gerek');

    if (dSkin == null && dSkinAge == null) return null;

    return (
        <section className="w-full grid grid-cols-2 gap-3 mb-4">
            {/* Skin Score Card */}
            <div className="bg-white rounded-3xl p-4 ambient-shadow flex flex-col justify-between relative">
                <div>
                    <div className="flex items-center gap-1 mb-2">
                        <h3 className="text-[14px] font-semibold text-[#1b1c1c]">
                            {localized('Skin Score', 'Cilt Skoru')}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setShowSkinInfo(true)}
                            className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors focus:outline-none"
                            aria-label={localized('Show skin score details', 'Cilt skoru detaylarını göster')}
                        >
                            <span className="material-symbols-outlined text-[14px] text-[#777681] select-none" data-icon="info">
                                info
                            </span>
                        </button>
                    </div>
                    {dSkin != null ? (
                        <>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-[28px] font-bold text-[#1b1c1c] leading-none">
                                    {dSkin.toFixed(1)}
                                </span>
                                <span className="text-[14px] font-semibold text-[#c7c5d2]">/10</span>
                            </div>
                            <p className={`${
                                dSkin >= 9.0 ? 'text-[#B8860B]' :
                                dSkin >= 7.0 ? 'text-green-600' :
                                dSkin >= 5.0 ? 'text-[#45478b]' : 'text-red-600'
                            } font-semibold mb-2 text-xs leading-tight`}>
                                {getSkinLabel(dSkin)}
                            </p>
                        </>
                    ) : (
                        <p className="text-[24px] font-extrabold text-[#c7c5d2]">—</p>
                    )}
                </div>
                {dSkin != null && (
                    <div className="inline-flex items-center gap-1 bg-black/[0.04] px-2 py-0.5 rounded-full w-fit">
                        <span className="material-symbols-outlined text-[12px] text-[#a311ae]" data-icon="trending_up">
                            trending_up
                        </span>
                        <span className="text-[9px] font-bold tracking-wider uppercase text-[#1b1c1c]">
                            {localized('Top 28% of users', 'İlk %28 kullanıcı')}
                        </span>
                    </div>
                )}

                {/* Skin Score Info Overlay */}
                {showSkinInfo && (
                    <div className="absolute inset-2 z-20 bg-white/95 backdrop-blur-md border border-black/10 rounded-2xl p-3 shadow-lg flex flex-col justify-center animate-fade-in-up">
                        <div>
                            <div className="flex justify-between items-center mb-1 font-bold text-[#2e2f72] text-[12px]">
                                <span>{localized('Skin Score Info', 'Cilt Skoru')}</span>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowSkinInfo(false); }} 
                                    className="material-symbols-outlined text-[14px] text-[#777681] hover:text-[#1b1c1c] p-0.5"
                                    aria-label={localized('Close', 'Kapat')}
                                >
                                    close
                                </button>
                            </div>
                            <p className="text-[10px] text-[#464650] leading-relaxed">
                                {localized(
                                    'Calculated as a weighted average of your key skin signals: Clarity, Texture, Barrier Defense, Sebum Balance, Tone Uniformity, and Radiance.',
                                    'Cilt skorunuz; Berraklık, Doku, Yüzey Bariyeri, Sebum Seviyesi, Ton Eşitliği ve Parlaklık gibi temel cilt metriklerinizin ağırlıklı ortalamasıyla hesaplanır.'
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Skin Age Card */}
            <div className="bg-white rounded-3xl p-4 ambient-shadow flex flex-col justify-between relative">
                <div>
                    <div className="flex items-center gap-1 mb-2">
                        <h3 className="text-[14px] font-semibold text-[#1b1c1c]">
                            {localized('Skin Age', 'Cilt Yaşı')}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setShowAgeInfo(true)}
                            className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors focus:outline-none"
                            aria-label={localized('Show skin age details', 'Cilt yaşı detaylarını göster')}
                        >
                            <span className="material-symbols-outlined text-[14px] text-[#777681] select-none" data-icon="info">
                                info
                            </span>
                        </button>
                    </div>
                    {dSkinAge != null ? (
                        <>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-[28px] font-bold text-[#1b1c1c] leading-none">
                                    {dSkinAge}
                                </span>
                            </div>
                            <p className="text-[#464650] text-xs mb-2 leading-tight">
                                {localized('Real age', 'Gerçek yaş')}: {dRealAge}
                            </p>
                        </>
                    ) : (
                        <p className="text-[24px] font-extrabold text-[#c7c5d2]">—</p>
                    )}
                </div>
                {dSkinAge != null && ageDiff != null && ageDiff !== 0 && (
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full w-fit ${
                        ageDiff > 0 ? 'bg-black/[0.04]' : 'bg-[#e8f5e9]/50'
                    }`}>
                        <span className={`text-[9px] font-bold tracking-wider uppercase ${
                            ageDiff > 0 ? 'text-[#1b1c1c]' : 'text-[#2e7d32]'
                        }`}>
                            {ageDiff > 0
                                ? `+${ageDiff} ${localized('years older', 'yaş üstü')}`
                                : `${ageDiff} ${localized('years younger', 'yaş altı')}`}
                        </span>
                    </div>
                )}

                {/* Skin Age Info Overlay */}
                {showAgeInfo && (
                    <div className="absolute inset-2 z-20 bg-white/95 backdrop-blur-md border border-black/10 rounded-2xl p-3 shadow-lg flex flex-col justify-center animate-fade-in-up">
                        <div>
                            <div className="flex justify-between items-center mb-1 font-bold text-[#2e2f72] text-[12px]">
                                <span>{localized('Skin Age Info', 'Cilt Yaşı')}</span>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowAgeInfo(false); }} 
                                    className="material-symbols-outlined text-[14px] text-[#777681] hover:text-[#1b1c1c] p-0.5"
                                    aria-label={localized('Close', 'Kapat')}
                                >
                                    close
                                </button>
                            </div>
                            <p className="text-[10px] text-[#464650] leading-relaxed">
                                {localized(
                                    'Estimated based on your skin quality and health markers compared to demographics data. Helps track your skin aging speed.',
                                    'Cilt kaliteniz ve bariyer sağlığınızın yaş grubu verileriyle karşılaştırılmasıyla tahmin edilir. Cildinizin yaşlanma hızını izlemenize yardımcı olur.'
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default SecondaryScores;
