import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';

export interface ProductSale {
  item_name: string;
  category: string;
  total_quantity: number;
  total_revenue: number;
  unit_price: number;
}

export const useProductSalesSummary = () => {
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchSales = useCallback(async (startDate: Date, endDate: Date) => {
    setIsLoading(true);
    try {
      const startISO = startOfDay(startDate).toISOString();
      const endISO = endOfDay(endDate).toISOString();

      // Query order_items directly with date filter - most efficient approach
      const { data, error } = await supabase
        .from('order_items')
        .select('item_name, item_price, quantity, category, created_at')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (error) {
        console.error('Error fetching product sales:', error);
        setSales([]);
        return;
      }

      if (!data || data.length === 0) {
        setSales([]);
        setTotalRevenue(0);
        setTotalItems(0);
        return;
      }

      // Aggregate by item_name in memory (fast)
      const aggregated: Record<string, ProductSale> = {};

      for (const item of data) {
        const key = item.item_name;
        if (!aggregated[key]) {
          aggregated[key] = {
            item_name: item.item_name,
            category: item.category,
            total_quantity: 0,
            total_revenue: 0,
            unit_price: item.item_price,
          };
        }
        aggregated[key].total_quantity += item.quantity;
        aggregated[key].total_revenue += item.item_price * item.quantity;
      }

      // Sort by total quantity descending
      const sorted = Object.values(aggregated).sort(
        (a, b) => b.total_quantity - a.total_quantity
      );

      const revenue = sorted.reduce((sum, p) => sum + p.total_revenue, 0);
      const items = sorted.reduce((sum, p) => sum + p.total_quantity, 0);

      setSales(sorted);
      setTotalRevenue(revenue);
      setTotalItems(items);
    } catch (err) {
      console.error('Error:', err);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sales,
    isLoading,
    totalRevenue,
    totalItems,
    fetchSales,
  };
};
