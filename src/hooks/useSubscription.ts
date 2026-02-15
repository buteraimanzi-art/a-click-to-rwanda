import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

const PAYPAL_PAYMENT_URL = "https://www.paypal.com/ncp/payment/YD6M888AMR5XW";

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
}

export const useSubscription = () => {
  const { user, session } = useApp();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!user || !session) {
      setIsLoading(false);
      setSubscription(null);
      setIsAdmin(false);
      return;
    }

    // Admin check is now handled server-side by manage-subscription edge function

    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'check' }
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setIsLoading(false);
        return;
      }

      setIsAdmin(data.isAdmin || false);
      setSubscription(data.subscription || null);
    } catch (err) {
      console.error('Subscription check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const hasActiveSubscription = isAdmin || subscription?.status === 'active';

  const openPaymentPage = () => {
    window.open(PAYPAL_PAYMENT_URL, '_blank');
  };

  // Call this when user confirms they've paid
  const activateSubscription = async (paymentReference: string) => {
    if (!user || !session) return false;

    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'activate', payment_reference: paymentReference }
      });

      if (error) {
        console.error('Error activating subscription:', error);
        return false;
      }

      if (data.success) {
        await checkSubscription();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Subscription activation failed:', err);
      return false;
    }
  };

  // Require subscription for booking actions
  const requireSubscription = (callback: () => void) => {
    if (hasActiveSubscription) {
      callback();
    } else {
      setShowPaywall(true);
    }
  };

  return {
    subscription,
    isLoading,
    isAdmin,
    hasActiveSubscription,
    openPaymentPage,
    activateSubscription,
    requireSubscription,
    showPaywall,
    setShowPaywall,
    PAYPAL_PAYMENT_URL,
  };
};
