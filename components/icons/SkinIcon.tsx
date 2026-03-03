import React from 'react';

export const SkinLayerIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* Diamond sparkle — left */}
        <path d="M5.5 3L6.2 4.8 8 5.5 6.2 6.2 5.5 8 4.8 6.2 3 5.5 4.8 4.8z" fill="currentColor" stroke="none" />
        {/* Small cross sparkle — right */}
        <path d="M16 2v3M14.5 3.5h3" strokeWidth={1.8} />
        {/* Diamond sparkle — center right */}
        <path d="M19 6l0.5 1.2 1.2 0.5-1.2 0.5L19 9.5l-0.5-1.2L17.3 7.8l1.2-0.5z" fill="currentColor" stroke="none" />

        {/* Skin surface — top wavy layer */}
        <path d="M2 12.5c1.5-1.2 3.5 0.8 6 0s4-1.2 6 0 3.5 0.8 5.5 0 2.5-0.3 2.5 0" strokeWidth={2} />
        {/* Dermis — second wavy layer */}
        <path d="M2 16c2-0.8 3.5 1 6 0.3s4.5-1.5 6-0.3 3.5 1 5.5 0.3 2.5-0.2 2.5 0" strokeWidth={1.6} opacity={0.6} />

        {/* Cells underneath */}
        <circle cx="6" cy="20" r="1.3" strokeWidth={1.5} fill="none" />
        <circle cx="10.5" cy="21" r="1" strokeWidth={1.5} fill="none" />
        <circle cx="15" cy="20" r="1.2" strokeWidth={1.5} fill="none" />
        <circle cx="19" cy="21.5" r="0.8" strokeWidth={1.5} fill="none" />
    </svg>
);
