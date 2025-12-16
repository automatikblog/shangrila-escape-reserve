-- Add is_sellable column to menu_items table
-- true = visible on menu for customers/staff ordering
-- false = inventory-only ingredient (not sold directly)
ALTER TABLE public.menu_items ADD COLUMN is_sellable boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.menu_items.is_sellable IS 'Whether this item appears on the customer/staff menu for ordering. false = ingredient/inventory only';