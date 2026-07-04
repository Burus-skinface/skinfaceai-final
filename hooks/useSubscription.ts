/**
 * Subscription Management Hook
 */

import { useState, useEffect } from 'react';
import { 
  SubscriptionState, 
  SubscriptionTier,
  getDefaultSubscription,
  getSubscriptionByTier,
  isSubscriptionExpired,
  canAccessFeature
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

  // Load subscription from the strongest available source.
  useEffect(() => {
    refreshSubscription();
  }, [userId]);

  // Save the resolved state locally for fast startup. Server/native sources still win on refresh.
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
        
        // Check if subscription is expired
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
        setSubscription(withSource(getSubscriptionByTier(SubscriptionTier.PRO_PLUS, expiresAt.toISOString()), 'dev'));
        return;
      }

      if (Capacitor.isNativePlatform()) {
        try {
          const { customerInfo } = await Purchases.getCustomerInfo();
          if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
            const expiresAt = customerInfo.entitlements.active[ENTITLEMENT_ID].expirationDate ?? undefined;
            setSubscription(withSource(getSubscriptionByTier(SubscriptionTier.PRO_PLUS, expiresAt), 'subscription'));
            return;
          }
        } catch (error) {
          console.error('Failed to refresh RevenueCat subscription:', error);
        }
      }

      if (userId) {
        const referralStatus = await getPremiumStatus(userId);
        if (referralStatus.isActive) {
          setSubscription(withSource(getSubscriptionByTier(SubscriptionTier.PRO_PLUS, referralStatus.expiresAt || undefined), 'referral'));
          return;
        }
      }

      const stored = loadStoredSubscription();
      // Stored paid state is only trusted for explicit dev unlock. Otherwise fall back to free.
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
    setSubscription(withSource(getSubscriptionByTier(SubscriptionTier.PRO_PLUS, expiresAt.toISOString()), 'dev'));
  };

  const cancelSubscription = () => {
    setSubscription(getDefaultSubscription());
  };

  const hasAccess = (feature: keyof SubscriptionState['features']): boolean => {
    return canAccessFeature(subscription, feature);
  };

  const isPro = subscription.tier === SubscriptionTier.PRO;
  const isProPlus = subscription.tier === SubscriptionTier.PRO_PLUS;
  const isFree = subscription.tier === SubscriptionTier.FREE;
  const isPremium = isPro || isProPlus;

  return {
    subscription,
    loading,
    refreshSubscription,
    activateDevSubscription,
    cancelSubscription,
    hasAccess,
    isPro,
    isProPlus,
    isFree,
    isPremium,
    premiumSource: subscription.source,
  };
}


