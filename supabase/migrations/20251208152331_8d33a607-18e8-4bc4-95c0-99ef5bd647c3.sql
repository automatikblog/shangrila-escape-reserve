-- Add delivery_type column to orders table
ALTER TABLE public.orders 
ADD COLUMN delivery_type text NOT NULL DEFAULT 'mesa';

-- Add check constraint for valid values
ALTER TABLE public.orders 
ADD CONSTRAINT orders_delivery_type_check CHECK (delivery_type IN ('mesa', 'balcao'));