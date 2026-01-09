-- Create print jobs queue table
CREATE TABLE public.print_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'completed', 'failed')),
  job_type TEXT NOT NULL CHECK (job_type IN ('new_order', 'order_items')),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  client_session_id UUID REFERENCES public.client_sessions(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  error_message TEXT,
  printed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS (but allow all since this is internal system)
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anon users (internal system table)
CREATE POLICY "Allow all operations on print_jobs" 
ON public.print_jobs 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Enable realtime for print jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.print_jobs;

-- Create function to generate print job when order is created
CREATE OR REPLACE FUNCTION public.create_print_job_for_order()
RETURNS TRIGGER AS $$
DECLARE
  v_table_number INTEGER;
  v_table_name TEXT;
  v_client_name TEXT;
  v_delivery_type TEXT;
  v_items JSONB;
BEGIN
  -- Get table info
  SELECT t.number, t.name INTO v_table_number, v_table_name
  FROM public.tables t
  WHERE t.id = NEW.table_id;

  -- Get client name
  SELECT cs.client_name INTO v_client_name
  FROM public.client_sessions cs
  WHERE cs.id = NEW.client_session_id;

  -- Get delivery type
  v_delivery_type := NEW.delivery_type;

  -- Get order items
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', oi.item_name,
      'quantity', oi.quantity,
      'price', oi.item_price,
      'category', oi.category
    )
  ) INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = NEW.id;

  -- Create print job
  INSERT INTO public.print_jobs (
    job_type,
    order_id,
    client_session_id,
    payload
  ) VALUES (
    'new_order',
    NEW.id,
    NEW.client_session_id,
    jsonb_build_object(
      'order_id', NEW.id,
      'table_number', v_table_number,
      'table_name', v_table_name,
      'client_name', v_client_name,
      'delivery_type', v_delivery_type,
      'notes', NEW.notes,
      'items', COALESCE(v_items, '[]'::jsonb),
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new orders
CREATE TRIGGER trigger_create_print_job_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_print_job_for_order();