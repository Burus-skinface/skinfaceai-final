/**
 * Subscription Types and Management
 */

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  PRO_PLUS = 'pro_plus'
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: string | null; // ISO date string
  features: {
    results: boolean;        // FREE - Always accessible (with daily limit)
    face: boolean;          // PRO+ only
    spectral: boolean;      // PRO+ only
    recommendations: boolean; // PRO+ only
    progress: boolean;      // PRO+ only
    unlimitedScans: boolean; // PRO+ only
  };
}

export interface PricingPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  badge?: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'monthly',
    tier: SubscriptionTier.PRO_PLUS,
    name: 'Monthly Access',
    price: '$16.00',
    period: '/month',
    popular: true,
    badge: 'RECOMMENDED',
    features: [
      'Save 20% vs Weekly',
      'Reveal General & Potential Scores',
      'Detailed Aesthetic Analysis',
      'Access Deep Forensics (Module 2)',
      'Access Maxxing Guide (Module 3)',
      'Full Progress Tracking'
    ],
  },
  {
    id: 'weekly',
    tier: SubscriptionTier.PRO_PLUS,
    name: 'Weekly Access',
    price: '$4.99',
    period: '/week',
    popular: false,
    features: [
      'Reveal General & Potential Scores',
      'Detailed Aesthetic Analysis',
      'Access Deep Forensics',
      'Access Maxxing Guide'
    ],
  },
];

/**
 * Get default free subscription state
 */
export function getDefaultSubscription(): SubscriptionState {
  return {
    tier: SubscriptionTier.FREE,
    expiresAt: null,
    features: {
      results: true,
      face: false,
      spectral: false,
      recommendations: false,
      progress: true, // Progress now FREE for all users!
      unlimitedScans: false,
    },
  };
}

/**
 * Get subscription state based on tier
 */
export function getSubscriptionByTier(tier: SubscriptionTier, expiresAt?: string): SubscriptionState {
  switch (tier) {
    case SubscriptionTier.PRO:
      return {
        tier,
        expiresAt: expiresAt || null,
        features: {
          results: true,
          face: false,
          spectral: false,
          recommendations: false,
          progress: true, // PRO gets progress (FREE also gets it)
          unlimitedScans: false,
        },
      };
    case SubscriptionTier.PRO_PLUS:
      return {
        tier,
        expiresAt: expiresAt || null,
        features: {
          results: true,
          face: true,
          spectral: true,
          recommendations: true,
          progress: true,
          unlimitedScans: true,
        },
      };
    case SubscriptionTier.FREE:
    default:
      return getDefaultSubscription();
  }
}

/**
 * Check if subscription is expired
 */
export function isSubscriptionExpired(subscription: SubscriptionState): boolean {
  if (!subscription.expiresAt) return false;
  return new Date(subscription.expiresAt) < new Date();
}

/**
 * Check if feature is accessible
 */
export function canAccessFeature(subscription: SubscriptionState, feature: keyof SubscriptionState['features']): boolean {
  if (isSubscriptionExpired(subscription)) {
    return getDefaultSubscription().features[feature];
  }
  return subscription.features[feature];
}

/**
 * Get required tier for a feature
 */
export function getRequiredTier(feature: keyof SubscriptionState['features']): SubscriptionTier {
  switch (feature) {
    case 'results':
    case 'progress':
      return SubscriptionTier.FREE;
    case 'face':
    case 'spectral':
    case 'recommendations':
    case 'unlimitedScans':
      return SubscriptionTier.PRO_PLUS;
    default:
      return SubscriptionTier.FREE;
  }
}


