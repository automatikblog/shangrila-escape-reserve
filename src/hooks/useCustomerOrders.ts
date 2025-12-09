import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderItem {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  category: string;
}

interface Order {
  id: string;
  table_id: string;
  client_session_id: string;
  status: OrderStatus;
  notes: string | null;
  delivery_type: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export const useCustomerOrders = (sessionId: string | null) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    try {
      // Use security definer function to get orders
      const { data: ordersData, error: ordersError } = await supabase
        .rpc('get_orders_by_session', { p_session_id: sessionId });

      if (ordersError) throw ordersError;

      // Fetch items for each order
      const ordersWithItems: Order[] = await Promise.all(
        (ordersData || []).map(async (order: any) => {
          const { data: itemsData } = await supabase
            .rpc('get_order_items_by_order', { p_order_id: order.id });

          return {
            ...order,
            items: itemsData || []
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchOrders();

    // Poll for updates every 5 seconds (since realtime requires SELECT access)
    const interval = setInterval(fetchOrders, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchOrders]);

  const createOrder = async (
    tableId: string,
    clientSessionId: string,
    items: { name: string; price: number; quantity: number; category: string; menuItemId?: string }[],
    notes?: string,
    deliveryType: 'mesa' | 'balcao' = 'mesa'
  ) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: tableId,
          client_session_id: clientSessionId,
          notes: notes || null,
          delivery_type: deliveryType
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId || null,
        item_name: item.name,
        item_price: item.price,
        quantity: item.quantity,
        category: item.category
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Decrement stock for items that have menu_item_id
      for (const item of items) {
        if (item.menuItemId) {
          await supabase.rpc('decrement_stock', {
            p_menu_item_id: item.menuItemId,
            p_quantity: item.quantity
          });
        }
      }

      // Refresh orders
      await fetchOrders();

      return { data: order, error: null };
    } catch (err: any) {
      console.error('Error creating order:', err);
      return { data: null, error: err.message };
    }
  };

  return {
    orders,
    isLoading,
    fetchOrders,
    createOrder
  };
};
