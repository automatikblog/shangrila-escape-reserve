import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StaleProduct {
  id: string;
  name: string;
  category: string;
  last_sale_at: string | null;
  days_since_sale: number;
}

export const useStaleProducts = (daysThreshold: number = 15) => {
  const [products, setProducts] = useState<StaleProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStaleProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_stale_products', { days_threshold: daysThreshold });

      if (error) {
        console.error('Error fetching stale products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [daysThreshold]);

  useEffect(() => {
    fetchStaleProducts();
  }, [fetchStaleProducts]);

  return {
    products,
    isLoading,
    refetch: fetchStaleProducts,
  };
};
