import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem, categoryLabels } from './useMenuItems';

/**
 * Hook for fetching only sellable menu items (is_sellable = true)
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
      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_sellable', true)
        .eq('is_available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setItems((data as MenuItem[]) || []);
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
