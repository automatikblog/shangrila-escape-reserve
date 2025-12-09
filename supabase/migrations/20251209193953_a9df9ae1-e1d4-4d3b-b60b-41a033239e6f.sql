-- Fix the INSERT policy for client_sessions to allow anonymous users to create sessions
-- The previous policy might have been incorrectly created or replaced

-- First drop any existing insert policies
DROP POLICY IF EXISTS "Anyone can create client sessions" ON public.client_sessions;

-- Recreate the insert policy with proper permissions for anonymous users
CREATE POLICY "Anyone can create client sessions"
ON public.client_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);