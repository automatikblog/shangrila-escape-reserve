-- Function to decrement stock safely (bypasses RLS)
CREATE OR REPLACE FUNCTION public.decrement_stock(p_menu_item_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.menu_items 
  SET 
    stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - p_quantity),
    is_available = (COALESCE(stock_quantity, 0) - p_quantity) > 0
  WHERE id = p_menu_item_id AND stock_quantity IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;