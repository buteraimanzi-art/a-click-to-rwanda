-- Create subscriptions table to track paid users
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  payment_method TEXT NOT NULL DEFAULT 'paypal',
  payment_reference TEXT,
  amount NUMERIC NOT NULL DEFAULT 50.00,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Only allow insert via edge function (service role)
CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);