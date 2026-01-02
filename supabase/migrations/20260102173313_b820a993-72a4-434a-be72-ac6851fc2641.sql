-- 1) New independent tables: inventory_items (Estoque) and menu_products (Cardápio)

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  product_code text[],
  stock_quantity integer,
  cost_price numeric,
  -- bottle/dose inventory fields
  is_bottle boolean NOT NULL DEFAULT false,
  bottle_ml integer,
  dose_ml integer,
  bottles_in_stock integer NOT NULL DEFAULT 0,
  current_bottle_ml integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  goes_to_kitchen boolean NOT NULL DEFAULT true,
  is_customizable boolean NOT NULL DEFAULT false,
  -- Optional link to inventory for direct debit or recipe ingredients
  inventory_item_id uuid NULL REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Replace item_recipes relationship to point to new tables (keep old table for now but extend it)
-- We add new columns so we can migrate gradually without breaking current code immediately.
ALTER TABLE public.item_recipes
  ADD COLUMN IF NOT EXISTS parent_product_id uuid,
  ADD COLUMN IF NOT EXISTS ingredient_inventory_item_id uuid;

-- Add FKs (nullable for safe migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'item_recipes_parent_product_id_fkey'
  ) THEN
    ALTER TABLE public.item_recipes
      ADD CONSTRAINT item_recipes_parent_product_id_fkey
      FOREIGN KEY (parent_product_id)
      REFERENCES public.menu_products(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'item_recipes_ingredient_inventory_item_id_fkey'
  ) THEN
    ALTER TABLE public.item_recipes
      ADD CONSTRAINT item_recipes_ingredient_inventory_item_id_fkey
      FOREIGN KEY (ingredient_inventory_item_id)
      REFERENCES public.inventory_items(id)
      ON DELETE RESTRICT;
  END IF;
END$$;

-- 3) updated_at triggers (we already have update_updated_at_column())
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inventory_items_updated_at') THEN
    CREATE TRIGGER trg_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_menu_products_updated_at') THEN
    CREATE TRIGGER trg_menu_products_updated_at
    BEFORE UPDATE ON public.menu_products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 4) RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_products ENABLE ROW LEVEL SECURITY;

-- inventory_items: admin-only (Estoque is backoffice)
DROP POLICY IF EXISTS "Admins can view inventory items" ON public.inventory_items;
CREATE POLICY "Admins can view inventory items"
ON public.inventory_items
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage inventory items" ON public.inventory_items;
CREATE POLICY "Admins can manage inventory items"
ON public.inventory_items
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- menu_products: public can view available products; admin manages
DROP POLICY IF EXISTS "Anyone can view available menu products" ON public.menu_products;
CREATE POLICY "Anyone can view available menu products"
ON public.menu_products
FOR SELECT
USING (is_available = true);

DROP POLICY IF EXISTS "Admins can manage menu products" ON public.menu_products;
CREATE POLICY "Admins can manage menu products"
ON public.menu_products
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5) One-time data migration from existing public.menu_items into the new tables (non-destructive)
-- Inventory: copy ALL existing items as inventory_items (same id) so existing stock tracking is preserved.
INSERT INTO public.inventory_items (
  id, name, description, product_code, stock_quantity, cost_price,
  is_bottle, bottle_ml, dose_ml, bottles_in_stock, current_bottle_ml,
  created_at, updated_at
)
SELECT
  mi.id,
  mi.name,
  mi.description,
  mi.product_code,
  mi.stock_quantity,
  mi.cost_price,
  COALESCE(mi.is_bottle, false),
  mi.bottle_ml,
  mi.dose_ml,
  COALESCE(mi.bottles_in_stock, 0),
  COALESCE(mi.current_bottle_ml, 0),
  mi.created_at,
  mi.created_at
FROM public.menu_items mi
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory_items ii WHERE ii.id = mi.id
);

-- Menu: copy sellable items as menu_products, linking to inventory by default (same id)
INSERT INTO public.menu_products (
  id, name, description, category, price,
  is_available, goes_to_kitchen, is_customizable,
  inventory_item_id,
  created_at, updated_at
)
SELECT
  mi.id,
  mi.name,
  mi.description,
  mi.category,
  mi.price,
  mi.is_available,
  mi.goes_to_kitchen,
  mi.is_customizable,
  mi.id,
  mi.created_at,
  mi.created_at
FROM public.menu_items mi
WHERE mi.is_sellable = true
  AND NOT EXISTS (
    SELECT 1 FROM public.menu_products mp WHERE mp.id = mi.id
  );

-- Recipes: backfill new FK columns based on old ids (keeps existing logic working while we migrate app code)
UPDATE public.item_recipes r
SET
  parent_product_id = r.parent_item_id,
  ingredient_inventory_item_id = r.ingredient_item_id
WHERE (r.parent_product_id IS NULL OR r.ingredient_inventory_item_id IS NULL);
