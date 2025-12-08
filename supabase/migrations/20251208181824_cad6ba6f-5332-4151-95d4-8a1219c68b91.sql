-- Update decrement_stock function to allow negative stock values
CREATE OR REPLACE FUNCTION public.decrement_stock(p_menu_item_id uuid, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.menu_items 
  SET 
    stock_quantity = COALESCE(stock_quantity, 0) - p_quantity
  WHERE id = p_menu_item_id AND stock_quantity IS NOT NULL;
END;
$function$;