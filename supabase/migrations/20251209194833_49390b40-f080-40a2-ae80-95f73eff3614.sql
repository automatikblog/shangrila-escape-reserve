
-- Update get_session_by_fingerprint to only return sessions from today (São Paulo timezone)
CREATE OR REPLACE FUNCTION public.get_session_by_fingerprint(p_fingerprint text, p_table_id uuid)
RETURNS TABLE(id uuid, client_name text, device_fingerprint text, table_id uuid, is_active boolean, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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
    AND DATE(cs.created_at AT TIME ZONE 'America/Sao_Paulo') = DATE(NOW() AT TIME ZONE 'America/Sao_Paulo')
  LIMIT 1;
$$;

-- Create helper function to get client name from any session today
CREATE OR REPLACE FUNCTION public.get_client_name_for_today(p_fingerprint text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT cs.client_name
  FROM public.client_sessions cs
  WHERE cs.device_fingerprint = p_fingerprint
    AND cs.is_active = true
    AND DATE(cs.created_at AT TIME ZONE 'America/Sao_Paulo') = DATE(NOW() AT TIME ZONE 'America/Sao_Paulo')
  ORDER BY cs.created_at DESC
  LIMIT 1;
$$;

-- Update get_orders_by_session to only return orders from today
CREATE OR REPLACE FUNCTION public.get_orders_by_session(p_session_id uuid)
RETURNS TABLE(id uuid, table_id uuid, client_session_id uuid, status order_status, notes text, delivery_type text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    o.id,
    o.table_id,
    o.client_session_id,
    o.status,
    o.notes,
    o.delivery_type,
    o.created_at,
    o.updated_at
  FROM public.orders o
  WHERE o.client_session_id = p_session_id
    AND DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo') = DATE(NOW() AT TIME ZONE 'America/Sao_Paulo')
  ORDER BY o.created_at DESC;
$$;
