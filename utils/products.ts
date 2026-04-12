export interface AffiliateProduct {
    id: string;
    name: string;
    description: string;
    category: 'cleanser' | 'moisturizer' | 'treatment' | 'tool' | 'supplement';
    tags: string[];
    amazonAffiliateLink: string;
    imageUrl: string;
    priceEstimation?: string;
}

export const PRODUCT_CATALOG: AffiliateProduct[] = [
    {
        id: 'CRV-CLEANSER-01',
        name: 'CeraVe Renewing SA Cleanser',
        description: 'Contains salicylic acid to gently exfoliate and smooth rough, acne-prone skin without disrupting the protective barrier.',
        category: 'cleanser',
        tags: ['acne', 'texture', 'oily'],
        amazonAffiliateLink: 'https://amzn.to/example-cerave-sa', // Replace with real affiliate link
        imageUrl: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=800&q=80', // Replace with actual product image URL
        priceEstimation: '$$'
    },
    {
        id: 'LRP-MOISTURIZER-01',
        name: 'La Roche-Posay Double Repair',
        description: 'Oil-free moisturizer with ceramides and niacinamide to restore the skin barrier.',
        category: 'moisturizer',
        tags: ['dry', 'barrier', 'redness', 'sensitive'],
        amazonAffiliateLink: 'https://amzn.to/example-lrp-double', 
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
        priceEstimation: '$$'
    },
    {
        id: 'JAWLINER-01',
        name: 'Jawliner Advanced Fitness',
        description: 'German engineered facial workout to build masseter muscles and sharpen the jawline.',
        category: 'tool',
        tags: ['jawline', 'contour', 'symmetry'],
        amazonAffiliateLink: 'https://amzn.to/example-jawliner',
        imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80', // Random gym/aesthetic placeholder
        priceEstimation: '$$$'
    },
    {
        id: 'GUASHA-01',
        name: 'Premium Jade Gua Sha Set',
        description: 'Lymphatic drainage tool to depuff facial tissues and temporarily sharpen contours.',
        category: 'tool',
        tags: ['bloat', 'fatigue', 'contour', 'puffiness'],
        amazonAffiliateLink: 'https://amzn.to/example-guasha',
        imageUrl: 'https://images.unsplash.com/photo-1615397323282-510006d96205?w=800&q=80',
        priceEstimation: '$'
    },
    {
        id: 'PC-BHA-01',
        name: 'Paula\'s Choice 2% BHA Liquid',
        description: 'Cult-favorite salicylic acid exfoliant to clear pores instantly and reduce redness.',
        category: 'treatment',
        tags: ['pores', 'acne', 'blackheads', 'texture'],
        amazonAffiliateLink: 'https://amzn.to/example-paulas-bha',
        imageUrl: 'https://images.unsplash.com/photo-1608248593842-8d76b1f2e879?w=800&q=80', // Cosmetic liquid placeholder
        priceEstimation: '$$$'
    },
    {
        id: 'MINOX-01',
        name: 'Kirkland 5% Minoxidil Solution',
        description: 'Clinically proven to stimulate follicular growth for patchy beards or thinning hair.',
        category: 'treatment',
        tags: ['beard', 'hair', 'patchy'],
        amazonAffiliateLink: 'https://amzn.to/example-minox',
        imageUrl: 'https://images.unsplash.com/photo-1626546377755-6677462ee67d?w=800&q=80',
        priceEstimation: '$$$'
    }
];
