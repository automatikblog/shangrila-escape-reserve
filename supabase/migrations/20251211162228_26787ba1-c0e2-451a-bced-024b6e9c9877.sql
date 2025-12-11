-- Create partial_payments table for tracking partial payments on comandas
CREATE TABLE public.partial_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_session_id uuid NOT NULL,
  amount numeric NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partial_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view partial payments"
ON public.partial_payments
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert partial payments"
ON public.partial_payments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage partial payments"
ON public.partial_payments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.partial_payments;