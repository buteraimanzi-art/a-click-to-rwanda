import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, Crown } from 'lucide-react';

interface SubscriptionStatusProps {
  hasActiveSubscription: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  onSubscribe: () => void;
}

export const SubscriptionStatus = ({ 
  hasActiveSubscription, 
  isAdmin, 
  isLoading, 
  onSubscribe 
}: SubscriptionStatusProps) => {
  if (isLoading) {
    return null;
  }

  if (hasActiveSubscription) {
    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
        <Check className="w-3 h-3 mr-1" />
        {isAdmin ? 'Admin Access' : 'Premium Member'}
      </Badge>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={onSubscribe}
      className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
    >
      <Crown className="w-4 h-4 mr-1" />
      Subscribe to Book
    </Button>
  );
};
