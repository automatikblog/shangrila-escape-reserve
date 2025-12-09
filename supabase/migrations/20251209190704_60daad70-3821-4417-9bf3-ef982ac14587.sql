-- 1. Fix client_sessions - create secure function and update policies
CREATE OR REPLACE FUNCTION public.get_session_by_fingerprint(p_fingerprint text, p_table_id uuid)
RETURNS TABLE (
  id uuid,
  client_name text,
  device_fingerprint text,
  table_id uuid,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cs.id,
    cs.client_name,
    cs.device_fingerprint,
    cs.table_id,
    cs.is_active,
    cs.created_at
  FROM public.client_sessions cs
  WHERE cs.device_fingerprint = p_fingerprint
    AND cs.table_id = p_table_id
    AND cs.is_active = true
  LIMIT 1;
$$;

-- Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view sessions by fingerprint" ON public.client_sessions;

-- Create secure admin/staff only SELECT policy  
CREATE POLICY "Admins and staff can view sessions"
  ON public.client_sessions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- 2. Fix order_items - restrict SELECT access
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;

CREATE POLICY "Admins and staff can view order items"
  ON public.order_items
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- 3. Fix update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;