-- Add payment tracking to individual orders
ALTER TABLE public.orders 
ADD COLUMN is_paid boolean NOT NULL DEFAULT false,
ADD COLUMN paid_at timestamp with time zone;