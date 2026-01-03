import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem, categoryLabels } from './useMenuItems';

/**
 * Hook for fetching only sellable menu items from menu_products
 * Used by customer QR code menu and staff ordering (Atendimento)
 */
export const useCardapioItems = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch from menu_products (new products table) with inventory_items join for dose/bottle info
      const { data, error: fetchError } = await supabase
        .from('menu_products')
        .select(`
          *,
          inventory_item:inventory_items(
            is_bottle,
            bottle_ml,
            dose_ml,
            bottles_in_stock,
            current_bottle_ml,
            stock_quantity
          )
        `)
        .eq('is_available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      
      // Map menu_products to MenuItem format for compatibility
      const mappedItems: MenuItem[] = (data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        is_available: product.is_available,
        stock_quantity: product.inventory_item?.stock_quantity ?? null,
        created_at: product.created_at,
        product_code: null,
        is_bottle: product.inventory_item?.is_bottle ?? false,
        bottle_ml: product.inventory_item?.bottle_ml ?? null,
        dose_ml: product.inventory_item?.dose_ml ?? null,
        bottles_in_stock: product.inventory_item?.bottles_in_stock ?? null,
        current_bottle_ml: product.inventory_item?.current_bottle_ml ?? null,
        cost_price: null,
        goes_to_kitchen: product.goes_to_kitchen,
        is_customizable: product.is_customizable,
        default_recipe_suggestion: null,
        is_sellable: true
      }));
      
      setItems(mappedItems);
    } catch (err: any) {
      console.error('Error fetching cardapio items:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Calculate available doses for a bottle item
  const getAvailableDoses = (item: MenuItem): number | null => {
    if (!item.is_bottle || !item.dose_ml || item.dose_ml <= 0) return null;
    
    const bottlesMl = (item.bottles_in_stock || 0) * (item.bottle_ml || 0);
    const currentMl = item.current_bottle_ml || 0;
    const totalMl = bottlesMl + currentMl;
    
    return Math.floor(totalMl / item.dose_ml);
  };

  const categories = [...new Set(items.map(item => item.category))];

  return {
    items,
    categories,
    isLoading,
    error,
    fetchItems,
    getAvailableDoses
  };
};

export { categoryLabels };
