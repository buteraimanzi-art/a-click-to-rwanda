import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, Shield, MapPin, Calendar, Car, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: () => void;
  onActivate: (ref: string) => Promise<boolean>;
}

export const PaywallModal = ({ isOpen, onClose, onPayment, onActivate }: PaywallModalProps) => {
  const [step, setStep] = useState<'info' | 'confirm'>('info');
  const [isActivating, setIsActivating] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  const features = [
    { icon: Calendar, text: "Unlimited itinerary bookings" },
    { icon: MapPin, text: "Access to all destinations & activities" },
    { icon: Car, text: "Car rental reservations" },
    { icon: Shield, text: "Priority customer support" },
  ];

  const handlePayment = () => {
    onPayment();
    setStep('confirm');
  };

  const handleConfirmPayment = async () => {
    if (!paymentRef.trim()) {
      toast.error('Please enter your PayPal transaction ID');
      return;
    }

    setIsActivating(true);
    const success = await onActivate(paymentRef);
    setIsActivating(false);

    if (success) {
      toast.success('Subscription activated! You can now book your adventure.');
      onClose();
      setStep('info');
      setPaymentRef('');
    } else {
      toast.error('Failed to activate subscription. Please contact support.');
    }
  };

  const handleClose = () => {
    onClose();
    setStep('info');
    setPaymentRef('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            {step === 'info' ? 'Unlock Full Access' : 'Confirm Payment'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 'info' 
              ? 'Subscribe to book your Rwanda adventure' 
              : 'Enter your PayPal transaction ID to activate'}
          </DialogDescription>
        </DialogHeader>

        {step === 'info' ? (
          <div className="space-y-6 py-4">
            {/* Price display */}
            <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-4xl font-bold text-primary">$50</div>
              <div className="text-sm text-muted-foreground mt-1">One-time payment</div>
              <div className="text-xs text-muted-foreground">Lifetime access</div>
            </div>

            {/* Features list */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                What's included:
              </h4>
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Info note */}
            <p className="text-xs text-muted-foreground text-center">
              You can create and plan your itinerary for free. 
              Subscribe when you're ready to book hotels, activities, and cars.
            </p>

            {/* CTA buttons */}
            <div className="space-y-2">
              <Button 
                onClick={handlePayment} 
                className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
                size="lg"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Pay with PayPal
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleClose}
                className="w-full"
              >
                Continue planning for free
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Secure payment
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Instant access
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                After completing payment on PayPal, enter your transaction ID below to activate your subscription.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">PayPal Transaction ID</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g., 5TY123456789ABCD"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Find this in your PayPal confirmation email or payment history
              </p>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleConfirmPayment} 
                className="w-full"
                size="lg"
                disabled={isActivating || !paymentRef.trim()}
              >
                {isActivating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Activate Subscription
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePayment}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Again / New Payment
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleClose}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
