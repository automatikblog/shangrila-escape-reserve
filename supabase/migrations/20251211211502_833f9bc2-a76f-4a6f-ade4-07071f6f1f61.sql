-- Phase 1: Add goes_to_kitchen field to menu_items
ALTER TABLE public.menu_items 
ADD COLUMN goes_to_kitchen boolean NOT NULL DEFAULT true;

-- Phase 3: Add customizable fields to menu_items
ALTER TABLE public.menu_items 
ADD COLUMN is_customizable boolean NOT NULL DEFAULT false;

ALTER TABLE public.menu_items 
ADD COLUMN default_recipe_suggestion jsonb DEFAULT NULL;

-- Phase 2: Create item_recipes table for compound items
CREATE TABLE public.item_recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  ingredient_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity_ml integer DEFAULT NULL,
  quantity_units integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(parent_item_id, ingredient_item_id)
);

-- Enable RLS on item_recipes
ALTER TABLE public.item_recipes ENABLE ROW LEVEL SECURITY;

-- RLS policies for item_recipes
CREATE POLICY "Anyone can view recipes" 
ON public.item_recipes 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage recipes" 
ON public.item_recipes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Phase 3: Add custom_ingredients to order_items
ALTER TABLE public.order_items 
ADD COLUMN custom_ingredients jsonb DEFAULT NULL;

-- Update decrement_stock function to handle recipes
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
  v_has_recipe BOOLEAN;
  v_recipe RECORD;
BEGIN
  -- Check if item has a recipe
  SELECT EXISTS (
    SELECT 1 FROM public.item_recipes WHERE parent_item_id = p_menu_item_id
  ) INTO v_has_recipe;

  IF v_has_recipe THEN
    -- Decrement each ingredient in the recipe
    FOR v_recipe IN 
      SELECT ingredient_item_id, quantity_ml, quantity_units 
      FROM public.item_recipes 
      WHERE parent_item_id = p_menu_item_id
    LOOP
      -- If quantity_ml is set, use the bottle/dose system
      IF v_recipe.quantity_ml IS NOT NULL AND v_recipe.quantity_ml > 0 THEN
        -- Get ingredient info
        SELECT is_bottle, bottle_ml, bottles_in_stock, current_bottle_ml
        INTO v_is_bottle, v_bottle_ml, v_bottles_in_stock, v_current_bottle_ml
        FROM public.menu_items
        WHERE id = v_recipe.ingredient_item_id;

        IF v_is_bottle = true THEN
          v_total_ml_needed := v_recipe.quantity_ml * p_quantity;
          v_remaining_ml := COALESCE(v_current_bottle_ml, 0);
          
          WHILE v_total_ml_needed > 0 LOOP
            IF v_remaining_ml >= v_total_ml_needed THEN
              v_remaining_ml := v_remaining_ml - v_total_ml_needed;
              v_total_ml_needed := 0;
            ELSE
              v_total_ml_needed := v_total_ml_needed - v_remaining_ml;
              v_remaining_ml := 0;
              
              IF COALESCE(v_bottles_in_stock, 0) > 0 THEN
                v_bottles_in_stock := v_bottles_in_stock - 1;
                v_remaining_ml := COALESCE(v_bottle_ml, 0);
              ELSE
                v_remaining_ml := v_remaining_ml - v_total_ml_needed;
                v_total_ml_needed := 0;
              END IF;
            END IF;
          END LOOP;
          
          UPDATE public.menu_items
          SET 
            bottles_in_stock = v_bottles_in_stock,
            current_bottle_ml = v_remaining_ml
          WHERE id = v_recipe.ingredient_item_id;
        END IF;
      ELSE
        -- Decrement by units
        UPDATE public.menu_items 
        SET stock_quantity = COALESCE(stock_quantity, 0) - (v_recipe.quantity_units * p_quantity)
        WHERE id = v_recipe.ingredient_item_id AND stock_quantity IS NOT NULL;
      END IF;
    END LOOP;
  ELSE
    -- Original logic for items without recipes
    SELECT is_bottle, bottle_ml, dose_ml, bottles_in_stock, current_bottle_ml
    INTO v_is_bottle, v_bottle_ml, v_dose_ml, v_bottles_in_stock, v_current_bottle_ml
    FROM public.menu_items
    WHERE id = p_menu_item_id;

    IF v_is_bottle = true AND v_dose_ml IS NOT NULL AND v_dose_ml > 0 THEN
      v_total_ml_needed := v_dose_ml * p_quantity;
      v_remaining_ml := COALESCE(v_current_bottle_ml, 0);
      
      WHILE v_total_ml_needed > 0 LOOP
        IF v_remaining_ml >= v_total_ml_needed THEN
          v_remaining_ml := v_remaining_ml - v_total_ml_needed;
          v_total_ml_needed := 0;
        ELSE
          v_total_ml_needed := v_total_ml_needed - v_remaining_ml;
          v_remaining_ml := 0;
          
          IF COALESCE(v_bottles_in_stock, 0) > 0 THEN
            v_bottles_in_stock := v_bottles_in_stock - 1;
            v_remaining_ml := COALESCE(v_bottle_ml, 0);
          ELSE
            v_remaining_ml := v_remaining_ml - v_total_ml_needed;
            v_total_ml_needed := 0;
          END IF;
        END IF;
      END LOOP;
      
      UPDATE public.menu_items
      SET 
        bottles_in_stock = v_bottles_in_stock,
        current_bottle_ml = v_remaining_ml
      WHERE id = p_menu_item_id;
    ELSE
      UPDATE public.menu_items 
      SET stock_quantity = COALESCE(stock_quantity, 0) - p_quantity
      WHERE id = p_menu_item_id AND stock_quantity IS NOT NULL;
    END IF;
  END IF;
END;
$function$;

-- Enable realtime for item_recipes
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_recipes;