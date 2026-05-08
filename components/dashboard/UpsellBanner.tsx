import React from 'react';

interface UpsellBannerProps {
    score: number;
    potential: number;
    onShowPaywall?: () => void;
}

const UpsellBanner: React.FC<UpsellBannerProps> = ({ potential, onShowPaywall }) => {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)',
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Glow */}
            <div style={{
                position: 'absolute', top: '-50%', right: '-20%', width: '150px', height: '150px',
                background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(168,85,247,0) 70%)',
                borderRadius: '50%', zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E879F9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <p style={{ fontSize: '12px', color: '#D4D4D8', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Plan Kilitli
                        </p>
                    </div>
                    
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px', lineHeight: 1.3 }}>
                        Skoru neden kaybettiğini gördün.
                    </p>
                    
                    <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '0 0 16px' }}>
                        Hedef çizgin {potential.toFixed(1)}+. 7 günlük görev planını açmadan o çizgi tahmin olarak kalır.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex', marginRight: '8px' }}>
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} style={{
                                    width: '24px', height: '24px', borderRadius: '50%', background: '#3F3F46',
                                    marginLeft: i > 0 ? '-8px' : '0', border: '2px solid #1C1C1E',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </div>
                            ))}
                        </div>
                        <span style={{ fontSize: '11px', color: '#D4D4D8', fontWeight: 600 }}>7 günlük skor görevi</span>
                    </div>
                </div>

                {/* Right side CTA Button */}
                <div style={{ flexShrink: 0 }}>
                    <button
                        onClick={onShowPaywall}
                        style={{
                            background: 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)',
                            color: '#fff', border: 'none', borderRadius: '16px',
                            padding: '16px 20px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            boxShadow: '0 4px 12px rgba(168,85,247,0.4)'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        Planı Aç
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpsellBanner;
