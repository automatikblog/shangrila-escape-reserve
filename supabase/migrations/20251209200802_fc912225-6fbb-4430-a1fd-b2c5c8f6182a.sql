-- Drop ALL existing policies on client_sessions
DROP POLICY IF EXISTS "Admins and staff can view sessions" ON public.client_sessions;
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.client_sessions;
DROP POLICY IF EXISTS "Allow anonymous insert sessions" ON public.client_sessions;
DROP POLICY IF EXISTS "Allow public insert sessions" ON public.client_sessions;

-- Create PERMISSIVE policies (default behavior)
-- Anyone can insert (for customers registering via QR code)
CREATE POLICY "Anyone can insert sessions" 
ON public.client_sessions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Anyone can view their own session (by fingerprint match handled in app)
CREATE POLICY "Anyone can view sessions" 
ON public.client_sessions 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Admins can do everything
CREATE POLICY "Admins can manage all sessions" 
ON public.client_sessions 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));