import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

const PAYPAL_PAYMENT_URL = "https://www.paypal.com/ncp/payment/YD6M888AMR5XW";

const PRICING: Record<string, number> = {
  rwandan: 0,
  east_african: 10,
  foreigner: 50,
};

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
  const [nationality, setNationality] = useState('foreigner');

  const checkSubscription = useCallback(async () => {
    if (!user || !session) {
      setIsLoading(false);
      setSubscription(null);
      setIsAdmin(false);
      return;
    }

    try {
      // Fetch nationality from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('nationality')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.nationality) {
        setNationality(profile.nationality);
      }

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
  const price = PRICING[nationality] ?? 50;

  const openPaymentPage = () => {
    window.open(PAYPAL_PAYMENT_URL, '_blank');
  };

  const activateSubscription = async (paymentReference: string) => {
    if (!user || !session) return false;

    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'activate', payment_reference: paymentReference, nationality, amount: price }
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
    nationality,
    price,
    PAYPAL_PAYMENT_URL,
  };
};
