-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Allow anonymous insert sessions" ON public.client_sessions;

-- Create a new PERMISSIVE INSERT policy (default is permissive)
CREATE POLICY "Allow public insert sessions" 
ON public.client_sessions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);