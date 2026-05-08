import React from 'react';
import { localized } from '../../localization';

interface HeroScoreCardProps {
    score: number | null;
    potential: number | null;
    animatedScore: number;
    imageUrl?: string;
    onShowPaywall?: () => void;
}

const HeroScoreCard: React.FC<HeroScoreCardProps> = ({ score, potential, animatedScore, imageUrl, onShowPaywall }) => {
    const displayScore = score !== null ? animatedScore : 0;
    const displayPotential = potential ?? (score ? Math.round(score * 1.12 * 10) / 10 : 0);

    const MIN = 4, MAX = 10, RANGE = MAX - MIN;
    const scorePercent = Math.max(0, Math.min(100, ((displayScore - MIN) / RANGE) * 100));

    const getLabel = (s: number) => {
        if (s >= 9) return localized('Glow Tier', 'Glow Tier');
        if (s >= 8) return localized('Strong Glow Signal', 'Güçlü Glow Sinyali');
        if (s >= 7) return localized('Level Up Line', 'Level Up Çizgisi');
        if (s >= 6) return localized('Stable', 'Stabil');
        if (s >= 5) return localized('Priority Open', 'Öncelik Var');
        return localized('Alert Zone', 'Alarm Bölgesi');
    };

    return (
        <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
            marginBottom: '16px',
            display: 'flex',
            gap: '24px'
        }}>
            {/* LEFT BLOCK: Score info, progress, tip */}
            <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* COL 1: GENEL SKORUN */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#48484A', letterSpacing: '0.5px' }}>{localized('GLOW SCORE', 'GLOW SKOR')}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
                            </svg>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                            <span style={{ fontSize: '64px', fontWeight: 800, color: '#1C1C1E', lineHeight: 1, letterSpacing: '-2px' }}>
                                {score !== null ? displayScore.toFixed(1) : '—'}
                            </span>
                            <span style={{ fontSize: '24px', fontWeight: 600, color: '#8E8E93' }}>/10</span>
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: '#5856D6', margin: '8px 0 12px' }}>
                            {score !== null ? getLabel(displayScore) : '—'}
                        </p>
                        {score !== null && score >= 5 && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                fontSize: '11px', fontWeight: 600,
                                color: '#5856D6', background: '#F2F2F7', borderRadius: '8px',
                                padding: '6px 10px', letterSpacing: '0.2px',
                            }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6M23 11h-6"/>
                                </svg>
                                {localized('Keep the streak and this glow line gets stronger', 'Seri korunursa glow çizgisi güçlenir')}
                            </span>
                        )}
                    </div>

                    {/* COL 2: POTANSİYELİN */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#48484A', letterSpacing: '0.5px' }}>{localized('LOCKED LEVEL', 'KİLİTLİ LEVEL')}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
                            </svg>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '42px', fontWeight: 800, color: '#1C1C1E', lineHeight: 1, letterSpacing: '-1px' }}>
                                {displayPotential.toFixed(1)}
                            </span>
                            <button onClick={onShowPaywall} style={{ background: '#F2EBFF', border: 'none', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <rect x="5" y="11" width="14" height="10" rx="3" stroke="#8B5CF6" strokeWidth="2"/>
                                    <path d="M8 11V7a4 4 0 118 0v4" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M12 15v2" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                        <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '12px', lineHeight: 1.5, maxWidth: '160px' }}>
                            {localized('Shows where your glow score can move.', 'Glow skorunu nereye taşıyabileceğini gösterir.')}<br/><br/>{localized('Looksmaxx plan opens in Premium.', "Looksmaxx plan Premium'da açılır.")}
                        </p>
                    </div>
                </div>

                <div>
                    {/* PROGRESS BAR */}
                    <div style={{ marginTop: '24px' }}>
                        <div style={{ position: 'relative', height: '6px', background: '#F2F2F7', borderRadius: '3px' }}>
                            <div style={{
                                position: 'absolute', left: 0, top: 0, height: '100%',
                                width: `${scorePercent}%`,
                                background: '#5856D6',
                                borderRadius: '3px', transition: 'width 1s ease',
                            }} />
                            <div style={{
                                position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
                                left: `${scorePercent}%`,
                                width: '16px', height: '16px', borderRadius: '50%',
                                background: '#5856D6', border: '3px solid #fff',
                                boxShadow: '0 2px 8px rgba(88,86,214,0.4)',
                                transition: 'left 1s ease', zIndex: 2,
                            }} />
                            {/* Potential Marker */}
                            <div style={{
                                position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
                                left: '100%', width: '4px', height: '12px', background: '#D1D1D6', borderRadius: '2px'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                            <div style={{ textAlign: 'center', marginLeft: `${scorePercent}%`, transform: 'translateX(-50%)', transition: 'margin-left 1s ease' }}>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1C1C1E', margin: 0 }}>{score !== null ? displayScore.toFixed(1) : '—'}</p>
                                <p style={{ fontSize: '11px', color: '#8E8E93', margin: '2px 0 0' }}>{localized('Glow line', 'Glow çizgisi')}</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1C1C1E', margin: 0 }}>{displayPotential.toFixed(1)}</p>
                                <p style={{ fontSize: '11px', color: '#8E8E93', margin: '2px 0 0' }}>{localized('Locked level', 'Kilitli level')}</p>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM TIP */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginTop: '20px', padding: '14px 16px',
                        background: '#F9F9FB',
                        borderRadius: '16px', border: '1px solid #F2F2F7',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#F2EBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.4 5.7 21l2.3-7-6-4.6h7.6L12 2z" stroke="#8B5CF6" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
                                </svg>
                            </div>
                            <span style={{ fontSize: '13px', color: '#48484A', fontWeight: 500 }}>
                                {localized('Unlock the looksmaxx plan and your target line opens up to', 'Looksmaxx plan açılırsa hedef çizgin')} <strong>{displayPotential.toFixed(1)}+</strong>{localized('.', ' seviyesine kadar açılır.')}
                            </span>
                        </div>
                        <button onClick={onShowPaywall} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#5856D6', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {localized('Unlock', 'Kilidi aç')}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT BLOCK: Photo */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#48484A', letterSpacing: '0.5px', marginBottom: '12px' }}>
                    {localized('TODAY SCAN', 'BUGÜNKÜ ÖLÇÜM')}
                </span>
                <div style={{
                    position: 'relative', width: '100%', flex: 1, minHeight: '280px',
                    borderRadius: '20px', overflow: 'hidden',
                    background: '#F2F2F7',
                }}>
                    {imageUrl ? (
                        <img src={imageUrl} alt={localized('Face', 'Yüz')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1">
                                <circle cx="12" cy="8" r="5"/>
                                <path d="M3 21c0-5 4-8 9-8s9 3 9 8"/>
                            </svg>
                        </div>
                    )}
                    {/* Handle slider */}
                    <div style={{
                        position: 'absolute', top: '0', bottom: '0', left: '50%', width: '2px', background: 'rgba(255,255,255,0.5)', transform: 'translateX(-50%)'
                    }}>
                        <div style={{
                            position: 'absolute', top: '75%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: '32px', height: '32px', borderRadius: '16px', background: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l6-6-6-6M9 18l-6-6 6-6" />
                            </svg>
                        </div>
                    </div>
                    {/* Bottom labels */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', height: '36px' }}>
                        <div style={{ flex: 1, background: 'rgba(28,28,30,0.85)', backdropFilter: 'blur(8px)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>
                            {localized('TODAY', 'BUGÜN')}
                        </div>
                        <div style={{ flex: 1, background: 'rgba(28,28,30,0.95)', backdropFilter: 'blur(8px)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>
                            {localized('TARGET', 'HEDEF')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroScoreCard;

