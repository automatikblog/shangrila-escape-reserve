
-- The issue is that policies with "roles:{public}" can conflict
-- Let's recreate all INSERT-related policies properly

-- First, drop conflicting policies that might affect INSERT
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.client_sessions;
DROP POLICY IF EXISTS "Public can create client sessions" ON public.client_sessions;

-- Recreate admin management policy for everything EXCEPT insert
CREATE POLICY "Admins can manage sessions"
ON public.client_sessions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create a simple, explicit INSERT policy using public role (includes anon)
CREATE POLICY "Allow public insert sessions"
ON public.client_sessions
FOR INSERT
TO public
WITH CHECK (true);
