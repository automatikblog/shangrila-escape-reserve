-- Drop legacy foreign key constraints that prevent using inventory_items properly
-- These constraints reference menu_items but we now use menu_products and inventory_items

ALTER TABLE public.item_recipes DROP CONSTRAINT IF EXISTS item_recipes_parent_item_id_fkey;
ALTER TABLE public.item_recipes DROP CONSTRAINT IF EXISTS item_recipes_ingredient_item_id_fkey;

-- Make the legacy columns nullable since they're no longer primary
ALTER TABLE public.item_recipes ALTER COLUMN parent_item_id DROP NOT NULL;
ALTER TABLE public.item_recipes ALTER COLUMN ingredient_item_id DROP NOT NULL;