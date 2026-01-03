-- Update decrement_stock to decrement inventory_items when recipes point to inventory
CREATE OR REPLACE FUNCTION public.decrement_stock(p_menu_item_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_has_recipe BOOLEAN;
  v_recipe RECORD;

  -- ingredient fields
  v_is_bottle BOOLEAN;
  v_bottle_ml INTEGER;
  v_dose_ml INTEGER;
  v_bottles_in_stock INTEGER;
  v_current_bottle_ml INTEGER;

  -- calculation
  v_total_ml_needed INTEGER;
  v_remaining_ml INTEGER;

  -- source resolution
  v_ingredient_id uuid;
  v_use_inventory BOOLEAN;
BEGIN
  -- Check if item has a recipe
  SELECT EXISTS (
    SELECT 1 FROM public.item_recipes WHERE parent_item_id = p_menu_item_id OR parent_product_id = p_menu_item_id
  ) INTO v_has_recipe;

  IF v_has_recipe THEN
    -- Decrement each ingredient in the recipe
    FOR v_recipe IN 
      SELECT ingredient_inventory_item_id, ingredient_item_id, quantity_ml, quantity_units
      FROM public.item_recipes
      WHERE parent_item_id = p_menu_item_id OR parent_product_id = p_menu_item_id
    LOOP
      v_use_inventory := v_recipe.ingredient_inventory_item_id IS NOT NULL;
      v_ingredient_id := COALESCE(v_recipe.ingredient_inventory_item_id, v_recipe.ingredient_item_id);

      -- Prefer inventory_items when available; fallback to menu_items if not found
      IF v_use_inventory THEN
        SELECT is_bottle, bottle_ml, dose_ml, bottles_in_stock, current_bottle_ml
        INTO v_is_bottle, v_bottle_ml, v_dose_ml, v_bottles_in_stock, v_current_bottle_ml
        FROM public.inventory_items
        WHERE id = v_ingredient_id;

        IF NOT FOUND THEN
          v_use_inventory := false;
        END IF;
      END IF;

      IF NOT v_use_inventory THEN
        SELECT is_bottle, bottle_ml, dose_ml, bottles_in_stock, current_bottle_ml
        INTO v_is_bottle, v_bottle_ml, v_dose_ml, v_bottles_in_stock, v_current_bottle_ml
        FROM public.menu_items
        WHERE id = v_ingredient_id;
      END IF;

      -- If quantity_ml is set, use ml depletion (bottle or not)
      IF v_recipe.quantity_ml IS NOT NULL AND v_recipe.quantity_ml > 0 THEN
        v_total_ml_needed := v_recipe.quantity_ml * p_quantity;
        v_remaining_ml := COALESCE(v_current_bottle_ml, 0);

        -- If it's a bottle item, use bottle opening logic; otherwise just decrement current_bottle_ml
        IF COALESCE(v_is_bottle, false) = true THEN
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
                -- Allow negative ml to track demand
                v_remaining_ml := v_remaining_ml - v_total_ml_needed;
                v_total_ml_needed := 0;
              END IF;
            END IF;
          END LOOP;

          IF v_use_inventory THEN
            UPDATE public.inventory_items
            SET bottles_in_stock = v_bottles_in_stock,
                current_bottle_ml = v_remaining_ml
            WHERE id = v_ingredient_id;
          ELSE
            UPDATE public.menu_items
            SET bottles_in_stock = v_bottles_in_stock,
                current_bottle_ml = v_remaining_ml
            WHERE id = v_ingredient_id;
          END IF;
        ELSE
          -- Non-bottle measured ingredient: decrement current_bottle_ml as ml bucket (can go negative)
          v_remaining_ml := COALESCE(v_current_bottle_ml, 0) - v_total_ml_needed;

          IF v_use_inventory THEN
            UPDATE public.inventory_items
            SET current_bottle_ml = v_remaining_ml
            WHERE id = v_ingredient_id;
          ELSE
            UPDATE public.menu_items
            SET current_bottle_ml = v_remaining_ml
            WHERE id = v_ingredient_id;
          END IF;
        END IF;
      ELSE
        -- Decrement by units
        IF v_use_inventory THEN
          UPDATE public.inventory_items
          SET stock_quantity = COALESCE(stock_quantity, 0) - (COALESCE(v_recipe.quantity_units, 0) * p_quantity)
          WHERE id = v_ingredient_id;
        ELSE
          UPDATE public.menu_items
          SET stock_quantity = COALESCE(stock_quantity, 0) - (COALESCE(v_recipe.quantity_units, 0) * p_quantity)
          WHERE id = v_ingredient_id AND stock_quantity IS NOT NULL;
        END IF;
      END IF;
    END LOOP;

  ELSE
    -- No recipe: try decrement on inventory_items first (if IDs happen to match), else fallback to menu_items
    SELECT is_bottle, bottle_ml, dose_ml, bottles_in_stock, current_bottle_ml
    INTO v_is_bottle, v_bottle_ml, v_dose_ml, v_bottles_in_stock, v_current_bottle_ml
    FROM public.inventory_items
    WHERE id = p_menu_item_id;

    IF FOUND THEN
      IF COALESCE(v_is_bottle, false) = true AND v_dose_ml IS NOT NULL AND v_dose_ml > 0 THEN
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

        UPDATE public.inventory_items
        SET bottles_in_stock = v_bottles_in_stock,
            current_bottle_ml = v_remaining_ml
        WHERE id = p_menu_item_id;
      ELSE
        UPDATE public.inventory_items
        SET stock_quantity = COALESCE(stock_quantity, 0) - p_quantity
        WHERE id = p_menu_item_id;
      END IF;

    ELSE
      -- Fallback to original menu_items behavior
      SELECT is_bottle, bottle_ml, dose_ml, bottles_in_stock, current_bottle_ml
      INTO v_is_bottle, v_bottle_ml, v_dose_ml, v_bottles_in_stock, v_current_bottle_ml
      FROM public.menu_items
      WHERE id = p_menu_item_id;

      IF COALESCE(v_is_bottle, false) = true AND v_dose_ml IS NOT NULL AND v_dose_ml > 0 THEN
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
        SET bottles_in_stock = v_bottles_in_stock,
            current_bottle_ml = v_remaining_ml
        WHERE id = p_menu_item_id;
      ELSE
        UPDATE public.menu_items
        SET stock_quantity = COALESCE(stock_quantity, 0) - p_quantity
        WHERE id = p_menu_item_id AND stock_quantity IS NOT NULL;
      END IF;
    END IF;
  END IF;
END;
$function$;