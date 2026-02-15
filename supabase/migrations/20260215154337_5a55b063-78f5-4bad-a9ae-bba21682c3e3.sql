
-- Fix 1: Add explicit write-denial RLS policies for reference tables

-- DESTINATIONS
CREATE POLICY "Only service role can insert destinations"
ON public.destinations FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Only service role can update destinations"
ON public.destinations FOR UPDATE
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Only service role can delete destinations"
ON public.destinations FOR DELETE
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- HOTELS
CREATE POLICY "Only service role can insert hotels"
ON public.hotels FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Only service role can update hotels"
ON public.hotels FOR UPDATE
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Only service role can delete hotels"
ON public.hotels FOR DELETE
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- CARS
CREATE POLICY "Only service role can insert cars"
ON public.cars FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Only service role can update cars"
ON public.cars FOR UPDATE
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Only service role can delete cars"
ON public.cars FOR DELETE
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ACTIVITIES
CREATE POLICY "Only service role can insert activities"
ON public.activities FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Only service role can update activities"
ON public.activities FOR UPDATE
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Only service role can delete activities"
ON public.activities FOR DELETE
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Fix 2: Create rate_limits table for edge function rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_key_expires ON public.rate_limits (key, expires_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Fix 3: Create staff_audit_log table for comprehensive audit logging
CREATE TABLE IF NOT EXISTS public.staff_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage staff audit log"
ON public.staff_audit_log FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Cleanup function to purge expired rate limits
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE expires_at < now();
$$;
