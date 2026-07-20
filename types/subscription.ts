/**
 * Subscription Types — single PRO tier (RevenueCat entitlement: premium)
 *
 * Free: Skin (results) + Progress only, 1 scan/day
 * PRO:  + Face + Glow Up + unlimited scans
 */

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: string | null;
  source: 'none' | 'subscription' | 'referral' | 'dev';
  features: {
    results: boolean;
    face: boolean;
    spectral: boolean;
    recommendations: boolean;
    progress: boolean;
    unlimitedScans: boolean;
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
    tier: SubscriptionTier.PRO,
    name: 'PRO Monthly',
    price: '$16.00',
    period: '/month',
    popular: true,
    badge: 'RECOMMENDED',
    features: [
      'Face structure analysis',
      'Glow Up routines & recommendations',
      'Unlimited daily scans',
      'Skin + Progress (included)',
    ],
  },
  {
    id: 'weekly',
    tier: SubscriptionTier.PRO,
    name: 'PRO Weekly',
    price: '$4.99',
    period: '/week',
    popular: false,
    features: [
      'Face structure analysis',
      'Glow Up routines & recommendations',
      'Unlimited daily scans',
    ],
  },
];

export function getDefaultSubscription(): SubscriptionState {
  return {
    tier: SubscriptionTier.FREE,
    expiresAt: null,
    source: 'none',
    features: {
      results: true,
      progress: true,
      face: false,
      spectral: false,
      recommendations: false,
      unlimitedScans: false,
    },
  };
}

/** Paid PRO feature set (also used for referral / DEV unlock). */
export function getProSubscription(expiresAt?: string, source: SubscriptionState['source'] = 'subscription'): SubscriptionState {
  return {
    tier: SubscriptionTier.PRO,
    expiresAt: expiresAt || null,
    source,
    features: {
      results: true,
      progress: true,
      face: true,
      spectral: true,
      recommendations: true,
      unlimitedScans: true,
    },
  };
}

export function getSubscriptionByTier(tier: SubscriptionTier, expiresAt?: string): SubscriptionState {
  if (tier === SubscriptionTier.PRO) {
    return getProSubscription(expiresAt, 'subscription');
  }
  return getDefaultSubscription();
}

export function isSubscriptionExpired(subscription: SubscriptionState): boolean {
  if (!subscription.expiresAt) return false;
  return new Date(subscription.expiresAt) < new Date();
}

export function canAccessFeature(
  subscription: SubscriptionState,
  feature: keyof SubscriptionState['features']
): boolean {
  if (isSubscriptionExpired(subscription)) {
    return getDefaultSubscription().features[feature];
  }
  return subscription.features[feature];
}

export function getRequiredTier(feature: keyof SubscriptionState['features']): SubscriptionTier {
  switch (feature) {
    case 'results':
    case 'progress':
      return SubscriptionTier.FREE;
    case 'face':
    case 'spectral':
    case 'recommendations':
    case 'unlimitedScans':
      return SubscriptionTier.PRO;
    default:
      return SubscriptionTier.FREE;
  }
}
