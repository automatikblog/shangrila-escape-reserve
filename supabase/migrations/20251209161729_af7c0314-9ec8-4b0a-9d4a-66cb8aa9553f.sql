-- Create a security definer function to get reservation counts without exposing PII
CREATE OR REPLACE FUNCTION public.get_reservation_counts(p_date date)
RETURNS TABLE(reservation_type text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.reservation_type,
    COUNT(*)::bigint
  FROM public.reservations r
  WHERE r.reservation_date = p_date
    AND r.status = 'confirmed'
  GROUP BY r.reservation_type;
$$;

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view reservation counts" ON public.reservations;

-- Create a new policy that only allows admins to SELECT reservation data
CREATE POLICY "Only admins can view reservations"
ON public.reservations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));