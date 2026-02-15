
-- Fix 1: Function search path mutable - set search_path on update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix 2: Add audit logging for SOS alert access
CREATE TABLE IF NOT EXISTS public.sos_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL,
  action text NOT NULL,
  alert_id uuid REFERENCES public.sos_alerts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sos_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read audit logs
CREATE POLICY "Service role can manage audit logs"
  ON public.sos_audit_log
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);
