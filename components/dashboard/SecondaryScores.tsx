import React from 'react';
import { localized } from '../../localization';

interface SecondaryScoresProps {
    skinScore: number | null;
    faceScore: number | null;
    potentialScore: number | null;
    skinAge: number | null;
    realAge: number | null;
    previousSkinScore?: number | null;
    previousFaceScore?: number | null;
    onShowPaywall?: () => void;
}

const SecondaryScores: React.FC<SecondaryScoresProps> = ({
    skinScore, faceScore, potentialScore, skinAge, realAge,
    previousSkinScore, previousFaceScore, onShowPaywall,
}) => {
    const dSkin = skinScore ?? 7.2;
    const dFace = faceScore ?? 8.1;
    const dPotential = potentialScore ?? 8.9;
    const dSkinAge = skinAge ?? 24;
    const dRealAge = realAge ?? 21;
    const ageDiff = dSkinAge - dRealAge;
    const skinDelta = previousSkinScore != null ? dSkin - previousSkinScore : 0.4;
    const faceDelta = previousFaceScore != null ? dFace - previousFaceScore : 0.1;

    const getSkinLabel = (s: number) => s >= 8.5 ? localized('Clean Signal', 'Temiz Sinyal') : s >= 7 ? localized('Good Line', 'İyi Çizgi') : s >= 5.5 ? localized('Stable', 'Stabil') : localized('Priority Open', 'Öncelik Var');
    const getFaceLabel = (s: number) => s >= 8.5 ? localized('Strong Lines', 'Güçlü Hat') : s >= 7 ? localized('Good Ratio', 'İyi Oran') : s >= 5.5 ? localized('Stable', 'Stabil') : localized('Behind', 'Geride');

    const cardStyle: React.CSSProperties = {
        background: '#fff',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    };

    const topHeaderStyle: React.CSSProperties = {
        fontSize: '11px', fontWeight: 700, color: '#48484A',
        letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px',
        marginBottom: '12px'
    };

    const bigNumberStyle: React.CSSProperties = {
        fontSize: '36px', fontWeight: 800, color: '#1C1C1E', lineHeight: 1, margin: 0,
    };

    const outOfStyle: React.CSSProperties = {
        fontSize: '16px', fontWeight: 600, color: '#8E8E93',
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* ====== SKIN CARD ====== */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                    {/* ICON LEFT */}
                    <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
                        </svg>
                    </div>
                    {/* MIDDLE: SKIN SCORE */}
                    <div style={{ flex: 1 }}>
                        <div style={topHeaderStyle}>
                            <span>{localized('SKIN SIGNAL', 'CİLT SİNYALİ')}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                        </div>
                        <p style={bigNumberStyle}>
                            {dSkin.toFixed(1)}<span style={outOfStyle}>/10</span>
                        </p>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: '#10B981', margin: '6px 0 0' }}>{getSkinLabel(dSkin)}</p>
                    </div>
                    {/* RIGHT: SKIN AGE */}
                    <div style={{ flex: 1 }}>
                        <div style={topHeaderStyle}>
                            <span>{localized('SKIN AGE', 'CİLT YAŞI')}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                        </div>
                        <p style={bigNumberStyle}>
                            {dSkinAge}<span style={outOfStyle}> yaş</span>
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '6px 0 0' }}>
                            <span style={{ fontSize: '11px', color: '#8E8E93' }}>{localized('Real age', 'Gerçek yaşın')}: {dRealAge}</span>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: ageDiff > 0 ? '#EF4444' : '#10B981', background: ageDiff > 0 ? '#FEE2E2' : '#D1FAE5', padding: '2px 6px', borderRadius: '6px' }}>
                                {ageDiff > 0 ? `+${ageDiff} yaş` : `${ageDiff} yaş`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Delta row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F2F2F7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: skinDelta >= 0 ? '#ECFDF5' : '#FEE2E2', padding: '4px 8px', borderRadius: '8px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={skinDelta >= 0 ? '#10B981' : '#EF4444'}>
                                <path d={skinDelta >= 0 ? "M12 4l8 8h-5v8h-6v-8H4l8-8z" : "M12 20l-8-8h5V4h6v8h5l-8 8z"}/>
                            </svg>
                            <span style={{ color: skinDelta >= 0 ? '#10B981' : '#EF4444', fontWeight: 700, fontSize: '12px' }}>+{Math.abs(skinDelta).toFixed(1)}</span>
                        </div>
                        <span style={{ color: '#8E8E93', fontSize: '12px' }}>{localized('vs last scan', 'son ölçüme göre')}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 500 }}>{localized('Trend tracking', 'Trend takibi')}</span>
                </div>

                {/* Green insight box */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '16px', background: '#F0FDF4',
                    borderRadius: '16px', border: '1px solid #DCFCE7',
                }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#22C55E" opacity="0.2"/>
                        <path d="M15.182 15.182a4.5 4.5 0 01-6.364 0" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="9" cy="10" r="1.5" fill="#16A34A"/>
                        <circle cx="15" cy="10" r="1.5" fill="#16A34A"/>
                    </svg>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#16A34A', margin: 0 }}>{localized('Skin signal is stable.', 'Cilt sinyali stabil.')}</p>
                        <p style={{ fontSize: '12px', color: '#15803D', margin: '2px 0 0' }}>{localized('Keep the streak; the line is ready to strengthen.', 'Seriyi koru; çizgi güçlenmeye hazır.')}</p>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </div>
            </div>

            {/* ====== FACE CARD ====== */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                    {/* ICON LEFT */}
                    <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#F3E8FF', border: '1px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="#7C3AED" strokeWidth="2"/>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="9" cy="9" r="1" fill="#7C3AED"/>
                            <circle cx="15" cy="9" r="1" fill="#7C3AED"/>
                        </svg>
                    </div>
                    {/* MIDDLE: FACE SCORE */}
                    <div style={{ flex: 1 }}>
                        <div style={topHeaderStyle}>
                            <span>{localized('FACE SIGNAL', 'YÜZ SİNYALİ')}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                        </div>
                        <p style={bigNumberStyle}>
                            {dFace.toFixed(1)}<span style={outOfStyle}>/10</span>
                        </p>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: '#5856D6', margin: '6px 0 0' }}>{getFaceLabel(dFace)}</p>
                    </div>
                    {/* RIGHT: POTENTIAL */}
                    <div style={{ flex: 1 }}>
                        <div style={topHeaderStyle}>
                            <span>{localized('LOCKED TARGET', 'KİLİTLİ HEDEF')}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p style={bigNumberStyle}>
                                {dPotential.toFixed(1)}
                            </p>
                            <button onClick={onShowPaywall} style={{ background: '#F2EBFF', border: 'none', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <rect x="4" y="11" width="16" height="10" rx="3" stroke="#8B5CF6" strokeWidth="2"/>
                                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M12 15v2" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                        <p style={{ fontSize: '11px', color: '#8E8E93', margin: '6px 0 0' }}>{localized('Full analysis opens in Premium.', "Tam analiz Premium'da açılır.")}</p>
                    </div>
                </div>

                {/* Delta row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F2F2F7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: faceDelta >= 0 ? '#F5F3FF' : '#FEE2E2', padding: '4px 8px', borderRadius: '8px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={faceDelta >= 0 ? '#7C3AED' : '#EF4444'}>
                                <path d={faceDelta >= 0 ? "M12 4l8 8h-5v8h-6v-8H4l8-8z" : "M12 20l-8-8h5V4h6v8h5l-8 8z"}/>
                            </svg>
                            <span style={{ color: faceDelta >= 0 ? '#7C3AED' : '#EF4444', fontWeight: 700, fontSize: '12px' }}>+{Math.abs(faceDelta).toFixed(1)}</span>
                        </div>
                        <span style={{ color: '#8E8E93', fontSize: '12px' }}>{localized('vs last scan', 'son ölçüme göre')}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 500 }}>{localized('Stable', 'Stabil')}</span>
                </div>

                {/* Locked insight box */}
                <div onClick={onShowPaywall} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px', background: '#F8F8FA',
                    borderRadius: '16px', border: '1px solid #E5E5EA', cursor: 'pointer',
                }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#F2EBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <rect x="4" y="11" width="16" height="10" rx="3" stroke="#8B5CF6" strokeWidth="2"/>
                            <path d="M7 11V7a5 5 0 0110 0v4" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <p style={{ fontSize: '13px', color: '#48484A', fontWeight: 500, margin: 0, flex: 1 }}>
                        {localized('Locked metrics show exactly where the score drops and how the target opens.', 'Kilitli metrikler açıkça söylüyor: skor nereden düşüyor, hedefe nasıl çıkıyor.')}
                    </p>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default SecondaryScores;
