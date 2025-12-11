-- Enable realtime for tables not yet added (orders already exists)
DO $$
BEGIN
  -- Try to add client_sessions
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.client_sessions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  -- Try to add order_items
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  -- Try to add partial_payments
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.partial_payments;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;