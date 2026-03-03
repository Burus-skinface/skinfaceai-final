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

const SUBSCRIPTION_STORAGE_KEY = 'facial_analysis_subscription';

export function useSubscription(isGuest: boolean = false) {
  const [subscription, setSubscription] = useState<SubscriptionState>(getDefaultSubscription());
  const [loading, setLoading] = useState(true);

  // Load subscription from localStorage on mount
  useEffect(() => {
    if (isGuest) {
      // Guest users get PRO+ automatically (temporary for testing)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year for guests
      const guestSubscription = getSubscriptionByTier(SubscriptionTier.PRO_PLUS, expiresAt.toISOString());
      setSubscription(guestSubscription);
      setLoading(false);
    } else {
      loadSubscription();
    }
  }, [isGuest]);

  // Save subscription to localStorage whenever it changes (but not for guests)
  useEffect(() => {
    if (!loading && !isGuest) {
      saveSubscription(subscription);
    }
  }, [subscription, loading, isGuest]);

  const loadSubscription = () => {
    try {
      const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (stored) {
        const parsed: SubscriptionState = JSON.parse(stored);
        
        // Check if subscription is expired
        if (isSubscriptionExpired(parsed)) {
          setSubscription(getDefaultSubscription());
        } else {
          setSubscription(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
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

  const upgradeTo = (tier: SubscriptionTier) => {
    // Calculate expiration (7 days from now for weekly subscription)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const newSubscription = getSubscriptionByTier(tier, expiresAt.toISOString());
    setSubscription(newSubscription);
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

  return {
    subscription,
    loading,
    upgradeTo,
    cancelSubscription,
    hasAccess,
    isPro,
    isProPlus,
    isFree,
  };
}


