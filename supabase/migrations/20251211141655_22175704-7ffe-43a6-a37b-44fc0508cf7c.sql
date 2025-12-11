-- Create settings table for configurable parameters
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage settings
CREATE POLICY "Admins can view settings" 
ON public.settings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage settings" 
ON public.settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES 
  ('table_inactivity_minutes', '40'),
  ('no_sales_alert_days', '15');

-- Create function to get products without recent sales
CREATE OR REPLACE FUNCTION public.get_stale_products(days_threshold integer DEFAULT 15)
RETURNS TABLE(
  id uuid,
  name text,
  category text,
  last_sale_at timestamp with time zone,
  days_since_sale integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    mi.id,
    mi.name,
    mi.category,
    MAX(oi.created_at) as last_sale_at,
    COALESCE(
      EXTRACT(DAY FROM (NOW() - MAX(oi.created_at)))::integer,
      9999
    ) as days_since_sale
  FROM public.menu_items mi
  LEFT JOIN public.order_items oi ON oi.menu_item_id = mi.id
  WHERE mi.is_available = true
  GROUP BY mi.id, mi.name, mi.category
  HAVING MAX(oi.created_at) < NOW() - (days_threshold || ' days')::interval
     OR MAX(oi.created_at) IS NULL
  ORDER BY days_since_sale DESC;
$$;

-- Create function to get table status with last order time
CREATE OR REPLACE FUNCTION public.get_tables_with_activity()
RETURNS TABLE(
  id uuid,
  number integer,
  name text,
  is_active boolean,
  client_name text,
  session_id uuid,
  last_order_at timestamp with time zone,
  minutes_since_order integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    t.id,
    t.number,
    t.name,
    t.is_active,
    cs.client_name,
    cs.id as session_id,
    MAX(o.created_at) as last_order_at,
    COALESCE(
      EXTRACT(EPOCH FROM (NOW() - MAX(o.created_at)))::integer / 60,
      NULL
    )::integer as minutes_since_order
  FROM public.tables t
  LEFT JOIN public.client_sessions cs ON cs.table_id = t.id 
    AND cs.is_active = true
    AND DATE(cs.created_at AT TIME ZONE 'America/Sao_Paulo') = DATE(NOW() AT TIME ZONE 'America/Sao_Paulo')
  LEFT JOIN public.orders o ON o.client_session_id = cs.id
    AND DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo') = DATE(NOW() AT TIME ZONE 'America/Sao_Paulo')
  GROUP BY t.id, t.number, t.name, t.is_active, cs.client_name, cs.id
  ORDER BY t.number;
$$;