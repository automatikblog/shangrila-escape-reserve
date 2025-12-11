-- Change product_code from TEXT to TEXT array for multiple supplier codes
ALTER TABLE public.menu_items 
ALTER COLUMN product_code TYPE TEXT[] USING 
  CASE 
    WHEN product_code IS NOT NULL THEN ARRAY[product_code]
    ELSE NULL
  END;