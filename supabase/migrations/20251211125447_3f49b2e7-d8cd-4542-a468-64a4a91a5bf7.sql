-- Add new columns to menu_items for bottle/dose control and product identification
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS product_code TEXT,
ADD COLUMN IF NOT EXISTS is_bottle BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bottle_ml INTEGER,
ADD COLUMN IF NOT EXISTS dose_ml INTEGER,
ADD COLUMN IF NOT EXISTS bottles_in_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_bottle_ml INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC;

-- Create or replace the decrement_stock function to handle bottle/dose logic
CREATE OR REPLACE FUNCTION public.decrement_stock(p_menu_item_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_bottle BOOLEAN;
  v_bottle_ml INTEGER;
  v_dose_ml INTEGER;
  v_bottles_in_stock INTEGER;
  v_current_bottle_ml INTEGER;
  v_total_ml_needed INTEGER;
  v_remaining_ml INTEGER;
BEGIN
  -- Get item info
  SELECT is_bottle, bottle_ml, dose_ml, bottles_in_stock, current_bottle_ml
  INTO v_is_bottle, v_bottle_ml, v_dose_ml, v_bottles_in_stock, v_current_bottle_ml
  FROM public.menu_items
  WHERE id = p_menu_item_id;

  -- If it's a bottle item with dose tracking
  IF v_is_bottle = true AND v_dose_ml IS NOT NULL AND v_dose_ml > 0 THEN
    v_total_ml_needed := v_dose_ml * p_quantity;
    v_remaining_ml := COALESCE(v_current_bottle_ml, 0);
    
    -- While we still need more ml
    WHILE v_total_ml_needed > 0 LOOP
      IF v_remaining_ml >= v_total_ml_needed THEN
        -- Current bottle has enough
        v_remaining_ml := v_remaining_ml - v_total_ml_needed;
        v_total_ml_needed := 0;
      ELSE
        -- Use what's left in current bottle
        v_total_ml_needed := v_total_ml_needed - v_remaining_ml;
        v_remaining_ml := 0;
        
        -- Open a new bottle if available
        IF COALESCE(v_bottles_in_stock, 0) > 0 THEN
          v_bottles_in_stock := v_bottles_in_stock - 1;
          v_remaining_ml := COALESCE(v_bottle_ml, 0);
        ELSE
          -- No more bottles, allow negative (informational tracking)
          v_remaining_ml := v_remaining_ml - v_total_ml_needed;
          v_total_ml_needed := 0;
        END IF;
      END IF;
    END LOOP;
    
    -- Update the item
    UPDATE public.menu_items
    SET 
      bottles_in_stock = v_bottles_in_stock,
      current_bottle_ml = v_remaining_ml
    WHERE id = p_menu_item_id;
  ELSE
    -- Regular stock decrement (allow negative for informational tracking)
    UPDATE public.menu_items 
    SET 
      stock_quantity = COALESCE(stock_quantity, 0) - p_quantity
    WHERE id = p_menu_item_id AND stock_quantity IS NOT NULL;
  END IF;
END;
$function$;