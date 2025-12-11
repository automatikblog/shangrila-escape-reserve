import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FrequentItem {
  menu_item_id: string;
  item_name: string;
  item_price: number;
  category: string;
  order_count: number;
}

export const useFrequentItems = (limit: number = 6) => {
  const [items, setItems] = useState<FrequentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFrequentItems = useCallback(async () => {
    try {
      // Get start of today in local timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch order_items from today, aggregate by menu_item_id
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          menu_item_id,
          item_name,
          item_price,
          category,
          quantity,
          created_at
        `)
        .gte('created_at', today.toISOString())
        .not('menu_item_id', 'is', null);

      if (error) {
        console.error('Error fetching frequent items:', error);
        return;
      }

      if (!data || data.length === 0) {
        setItems([]);
        return;
      }

      // Filter out service items and aggregate
      const aggregated = data
        .filter(item => item.category !== 'servicos')
        .reduce((acc, item) => {
          const key = item.menu_item_id;
          if (!acc[key]) {
            acc[key] = {
              menu_item_id: item.menu_item_id,
              item_name: item.item_name,
              item_price: item.item_price,
              category: item.category,
              order_count: 0,
            };
          }
          acc[key].order_count += item.quantity;
          return acc;
        }, {} as Record<string, FrequentItem>);

      // Sort by order_count descending and take top N
      const sorted = Object.values(aggregated)
        .sort((a, b) => b.order_count - a.order_count)
        .slice(0, limit);

      setItems(sorted);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFrequentItems();

    // Real-time subscription for updates
    const channel = supabase
      .channel('frequent-items-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => fetchFrequentItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFrequentItems]);

  return {
    items,
    isLoading,
    refetch: fetchFrequentItems,
  };
};
