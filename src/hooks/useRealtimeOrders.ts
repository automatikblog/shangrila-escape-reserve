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
  menu_item_id: string | null;
  goes_to_kitchen?: boolean;
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
  is_paid: boolean;
  paid_at: string | null;
  items?: OrderItem[];
  table?: { number: number; name: string };
  client?: { client_name: string };
}

export const useRealtimeOrders = (statusFilter?: OrderStatus[]) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*, menu_item:menu_items(goes_to_kitchen)),
          table:tables(number, name),
          client:client_sessions(client_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Map items to include goes_to_kitchen from joined menu_item
      const mappedData = (data || []).map(order => ({
        ...order,
        items: order.items?.map((item: any) => ({
          ...item,
          goes_to_kitchen: item.menu_item?.goes_to_kitchen ?? true
        }))
      }));
      
      setOrders(mappedData);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('Error updating order:', err);
      return { error: err.message };
    }
  };

  const createOrder = async (
    tableId: string,
    clientSessionId: string,
    items: { name: string; price: number; quantity: number; category: string; menuItemId?: string }[],
    notes?: string,
    deliveryType: 'mesa' | 'balcao' = 'mesa',
    initialStatus?: OrderStatus
  ) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: tableId,
          client_session_id: clientSessionId,
          notes: notes || null,
          delivery_type: deliveryType,
          ...(initialStatus && { status: initialStatus })
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

      // Decrement stock for items that have menu_item_id using RPC (bypasses RLS)
      for (const item of items) {
        if (item.menuItemId) {
          await supabase.rpc('decrement_stock', {
            p_menu_item_id: item.menuItemId,
            p_quantity: item.quantity
          });
        }
      }

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
    updateOrderStatus,
    createOrder
  };
};
