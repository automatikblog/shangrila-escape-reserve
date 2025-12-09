-- Drop the problematic policy that uses "public" role
DROP POLICY IF EXISTS "Allow public insert sessions" ON public.client_sessions;

-- Create new policy with explicit anon and authenticated roles
CREATE POLICY "Allow anonymous insert sessions"
ON public.client_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);