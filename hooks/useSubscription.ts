/**
 * Subscription Management Hook — single PRO tier
 */

import { useState, useEffect } from 'react';
import {
  SubscriptionState,
  SubscriptionTier,
  getDefaultSubscription,
  getSubscriptionByTier,
  getProSubscription,
  isSubscriptionExpired,
  canAccessFeature,
} from '../types/subscription';
import { getPremiumStatus } from '../services/referralService';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const SUBSCRIPTION_STORAGE_KEY = 'facial_analysis_subscription';

const ENTITLEMENT_ID = import.meta.env.VITE_RC_ENTITLEMENT_ID || 'premium';
const DEV_PREMIUM_UNLOCKED =
  import.meta.env.DEV && import.meta.env.VITE_DEV_UNLOCK_PREMIUM === 'true';

function withSource(
  subscription: SubscriptionState,
  source: SubscriptionState['source']
): SubscriptionState {
  return { ...subscription, source };
}

export function useSubscription(userId?: string | null) {
  const [subscription, setSubscription] = useState<SubscriptionState>(getDefaultSubscription());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshSubscription();
  }, [userId]);

  useEffect(() => {
    if (!loading) {
      saveSubscription(subscription);
    }
  }, [subscription, loading]);

  const loadStoredSubscription = (): SubscriptionState => {
    try {
      const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (stored) {
        const parsed: SubscriptionState = JSON.parse(stored);
        // Migrate legacy pro_plus → pro
        if ((parsed as any).tier === 'pro_plus') {
          parsed.tier = SubscriptionTier.PRO;
        }
        if (isSubscriptionExpired(parsed)) {
          return getDefaultSubscription();
        }
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
    return getDefaultSubscription();
  };

  const refreshSubscription = async () => {
    setLoading(true);
    try {
      if (DEV_PREMIUM_UNLOCKED) {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        setSubscription(withSource(getProSubscription(expiresAt.toISOString(), 'dev'), 'dev'));
        return;
      }

      if (Capacitor.isNativePlatform()) {
        try {
          const { customerInfo } = await Purchases.getCustomerInfo();
          if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
            const expiresAt = customerInfo.entitlements.active[ENTITLEMENT_ID].expirationDate ?? undefined;
            setSubscription(withSource(getProSubscription(expiresAt, 'subscription'), 'subscription'));
            return;
          }
        } catch (error) {
          console.error('Failed to refresh RevenueCat subscription:', error);
        }
      }

      if (userId) {
        const referralStatus = await getPremiumStatus(userId);
        if (referralStatus.isActive) {
          setSubscription(
            withSource(getProSubscription(referralStatus.expiresAt || undefined, 'referral'), 'referral')
          );
          return;
        }
      }

      const stored = loadStoredSubscription();
      setSubscription(stored.source === 'dev' && DEV_PREMIUM_UNLOCKED ? stored : getDefaultSubscription());
    } finally {
      setLoading(false);
    }
  };

  const saveSubscription = (state: SubscriptionState) => {
    try {
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  };

  const activateDevSubscription = () => {
    if (!DEV_PREMIUM_UNLOCKED) {
      return;
    }
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    setSubscription(withSource(getProSubscription(expiresAt.toISOString(), 'dev'), 'dev'));
  };

  const cancelSubscription = () => {
    setSubscription(getDefaultSubscription());
  };

  const hasAccess = (feature: keyof SubscriptionState['features']): boolean => {
    return canAccessFeature(subscription, feature);
  };

  const isPro = subscription.tier === SubscriptionTier.PRO;
  const isFree = subscription.tier === SubscriptionTier.FREE;
  const isPremium = isPro;

  return {
    subscription,
    loading,
    refreshSubscription,
    activateDevSubscription,
    cancelSubscription,
    hasAccess,
    isPro,
    /** @deprecated Use isPro — single PRO tier */
    isProPlus: isPro,
    isFree,
    isPremium,
    premiumSource: subscription.source,
  };
}
