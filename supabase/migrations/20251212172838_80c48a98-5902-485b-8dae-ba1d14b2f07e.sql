-- Add payment_method to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT NULL;

-- Add payment_method to partial_payments table
ALTER TABLE public.partial_payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT NULL;

-- Add discount to client_sessions table (discount applied to the whole comanda)
ALTER TABLE public.client_sessions 
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;