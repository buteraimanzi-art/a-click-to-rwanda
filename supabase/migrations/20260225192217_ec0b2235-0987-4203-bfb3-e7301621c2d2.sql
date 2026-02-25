-- Fix the recursive "Staff can view all profiles" RLS policy
-- It references profiles within its own policy causing infinite recursion
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

-- Replace with a policy that uses the user_roles table (no recursion)
CREATE POLICY "Staff can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.revoked_at IS NULL
  )
);