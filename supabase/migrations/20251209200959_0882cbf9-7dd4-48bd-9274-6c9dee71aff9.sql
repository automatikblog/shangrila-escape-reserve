-- Fix orders table policies
DROP POLICY IF EXISTS "Admins and staff can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins and staff can view orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Permissive policies for orders
CREATE POLICY "Anyone can insert orders" 
ON public.orders FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view orders" 
ON public.orders FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Staff can update orders" 
ON public.orders FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can delete orders" 
ON public.orders FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix order_items table policies
DROP POLICY IF EXISTS "Admins and staff can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Permissive policies for order_items
CREATE POLICY "Anyone can insert order items" 
ON public.order_items FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view order items" 
ON public.order_items FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage order items" 
ON public.order_items FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));