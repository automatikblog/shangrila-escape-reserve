
-- Drop ALL existing insert policies on client_sessions
DROP POLICY IF EXISTS "Anyone can create client sessions" ON public.client_sessions;
DROP POLICY IF EXISTS "Anyone can create client sessions " ON public.client_sessions;

-- Create new policy that explicitly allows anon and authenticated to insert
CREATE POLICY "Public can create client sessions"
ON public.client_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
