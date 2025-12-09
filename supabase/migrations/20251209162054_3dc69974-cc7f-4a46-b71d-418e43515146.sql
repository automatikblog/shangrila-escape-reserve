-- Create a security definer function to get orders for a specific session
CREATE OR REPLACE FUNCTION public.get_orders_by_session(p_session_id uuid)
RETURNS TABLE(
  id uuid,
  table_id uuid,
  client_session_id uuid,
  status order_status,
  notes text,
  delivery_type text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
  ORDER BY o.created_at DESC;
$$;

-- Create a function to get order items for a specific order
CREATE OR REPLACE FUNCTION public.get_order_items_by_order(p_order_id uuid)
RETURNS TABLE(
  id uuid,
  order_id uuid,
  menu_item_id uuid,
  item_name text,
  item_price numeric,
  quantity integer,
  category text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    oi.id,
    oi.order_id,
    oi.menu_item_id,
    oi.item_name,
    oi.item_price,
    oi.quantity,
    oi.category
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id;
$$;

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view orders by session" ON public.orders;

-- Create a policy that only allows admins and staff to SELECT orders
CREATE POLICY "Admins and staff can view orders"
ON public.orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));