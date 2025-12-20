import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ComandaItem {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  created_at: string;
}

export interface ComandaOrder {
  id: string;
  notes: string | null;
  delivery_type: string;
  created_at: string;
  is_paid: boolean;
  paid_at: string | null;
  payment_method: string | null;
  items: ComandaItem[];
  order_total: number;
}

export interface PartialPayment {
  id: string;
  amount: number;
  notes: string | null;
  payment_method: string | null;
  created_at: string;
}

export interface Comanda {
  session_id: string;
  client_name: string;
  table_id: string;
  table_number: number;
  table_name: string;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  discount: number;
  total: number;
  paid_total: number;
  unpaid_total: number;
  partial_payments_total: number;
  remaining_total: number;
  items: ComandaItem[];
  orders: ComandaOrder[];
  partial_payments: PartialPayment[];
}

interface UseComandaOptions {
  tableNumber?: number;
  activeOnly?: boolean;
}

export const useComandas = (options?: UseComandaOptions) => {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComandas = useCallback(async () => {
    try {
      // Build query - NO date filter, comandas only disappear when closed (is_active = false)
      let query = supabase
        .from('client_sessions')
        .select(`
          id,
          client_name,
          table_id,
          is_paid,
          paid_at,
          created_at,
          is_active,
          discount,
          tables!inner (
            number,
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by active only if requested
      if (options?.activeOnly !== false) {
        query = query.eq('is_active', true);
      }

      const { data: sessions, error: sessionsError } = await query;

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        return;
      }

      if (!sessions || sessions.length === 0) {
        setComandas([]);
        return;
      }

      // Filter by table number if specified
      let filteredSessions = sessions;
      if (options?.tableNumber !== undefined) {
        filteredSessions = sessions.filter(
          (s: any) => s.tables.number === options.tableNumber
        );
      }

      // Fetch orders and items for each session
      const comandasWithTotals: Comanda[] = await Promise.all(
        filteredSessions.map(async (session: any) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('id, notes, delivery_type, created_at, is_paid, paid_at, payment_method')
            .eq('client_session_id', session.id)
            .order('created_at', { ascending: true });

          // Fetch partial payments for this session
          const { data: partialPaymentsData } = await supabase
            .from('partial_payments')
            .select('id, amount, notes, created_at, payment_method')
            .eq('client_session_id', session.id)
            .order('created_at', { ascending: true });

          const partialPayments: PartialPayment[] = partialPaymentsData || [];
          const partialPaymentsTotal = partialPayments.reduce(
            (sum, pp) => sum + Number(pp.amount),
            0
          );

          let total = 0;
          let paidTotal = 0;
          let unpaidTotal = 0;
          let allItems: ComandaItem[] = [];
          let ordersWithItems: ComandaOrder[] = [];

          if (orders && orders.length > 0) {
            for (const order of orders) {
              const { data: orderItems } = await supabase
                .from('order_items')
                .select('id, item_name, item_price, quantity, created_at')
                .eq('order_id', order.id);

              const items = orderItems || [];
              const orderTotal = items.reduce(
                (sum, item) => sum + (item.item_price * item.quantity),
                0
              );
              total += orderTotal;
              
              if (order.is_paid) {
                paidTotal += orderTotal;
              } else {
                unpaidTotal += orderTotal;
              }
              
              allItems = [...allItems, ...items];

              ordersWithItems.push({
                id: order.id,
                notes: order.notes,
                delivery_type: order.delivery_type,
                created_at: order.created_at,
                is_paid: order.is_paid,
                paid_at: order.paid_at,
                payment_method: order.payment_method,
                items,
                order_total: orderTotal,
              });
            }
          }

          const sessionDiscount = Number(session.discount) || 0;
          const remainingTotal = Math.max(0, total - paidTotal - partialPaymentsTotal - sessionDiscount);

          return {
            session_id: session.id,
            client_name: session.client_name,
            table_id: session.table_id,
            table_number: session.tables.number,
            table_name: session.tables.name,
            is_paid: session.is_paid,
            paid_at: session.paid_at,
            created_at: session.created_at,
            discount: sessionDiscount,
            total,
            paid_total: paidTotal,
            unpaid_total: unpaidTotal,
            partial_payments_total: partialPaymentsTotal,
            remaining_total: remainingTotal,
            items: allItems,
            orders: ordersWithItems,
            partial_payments: partialPayments,
          };
        })
      );

      setComandas(comandasWithTotals);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [options?.tableNumber, options?.activeOnly]);

  useEffect(() => {
    fetchComandas();
    
    // Real-time subscription for instant updates - using unique channel name
    const channelName = `comandas-realtime-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_sessions' },
        (payload) => {
          console.log('Realtime: client_sessions changed', payload);
          fetchComandas();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime: orders changed', payload);
          fetchComandas();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
          console.log('Realtime: order_items changed', payload);
          fetchComandas();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partial_payments' },
        (payload) => {
          console.log('Realtime: partial_payments changed', payload);
          fetchComandas();
        }
      )
      .subscribe((status) => {
        console.log('Comandas realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComandas]);

  const markAsPaid = async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('client_sessions')
        .update({ 
          is_paid: true, 
          paid_at: new Date().toISOString() 
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error marking as paid:', error);
        return false;
      }

      await fetchComandas();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const markAsUnpaid = async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('client_sessions')
        .update({ 
          is_paid: false, 
          paid_at: null 
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error marking as unpaid:', error);
        return false;
      }

      await fetchComandas();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const closeComanda = async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('client_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) {
        console.error('Error closing comanda:', error);
        return false;
      }

      await fetchComandas();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const markOrderPaid = async (orderId: string, paymentMethod?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          is_paid: true, 
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod || null,
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error marking order as paid:', error);
        return false;
      }

      await fetchComandas();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const markOrderUnpaid = async (orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          is_paid: false, 
          paid_at: null 
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error marking order as unpaid:', error);
        return false;
      }

      await fetchComandas();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const addPartialPayment = async (
    sessionId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('partial_payments')
        .insert({
          client_session_id: sessionId,
          amount,
          notes: notes || null,
          payment_method: paymentMethod,
        });

      if (error) {
        console.error('Error adding partial payment:', error);
        return false;
      }

      await fetchComandas();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const updateDiscount = async (sessionId: string, discount: number): Promise<boolean> => {
    try {
      // Find the comanda to check if remaining will be 0 after discount
      const comanda = comandas.find(c => c.session_id === sessionId);
      
      const { error } = await supabase
        .from('client_sessions')
        .update({ discount })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating discount:', error);
        return false;
      }

      // If discount zeroes out the remaining total, mark as paid
      if (comanda) {
        const newRemaining = Math.max(0, comanda.total - comanda.paid_total - comanda.partial_payments_total - discount);
        if (newRemaining === 0 && !comanda.is_paid) {
          await supabase
            .from('client_sessions')
            .update({ 
              is_paid: true, 
              paid_at: new Date().toISOString() 
            })
            .eq('id', sessionId);
        }
      }

      await fetchComandas();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const updateItemQuantity = async (itemId: string, newQuantity: number): Promise<boolean> => {
    try {
      if (newQuantity <= 0) {
        return deleteItem(itemId);
      }
      
      const { error } = await supabase
        .from('order_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating item quantity:', error);
        return false;
      }

      await fetchComandas();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const deleteItem = async (itemId: string): Promise<boolean> => {
    try {
      // First, get the order_id for this item
      const { data: itemData } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('id', itemId)
        .single();

      const orderId = itemData?.order_id;

      // Delete the item
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting item:', error);
        return false;
      }

      // Check if the order has any remaining items
      if (orderId) {
        const { data: remainingItems } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', orderId);

        // If no items left, delete the order too
        if (!remainingItems || remainingItems.length === 0) {
          await supabase
            .from('orders')
            .delete()
            .eq('id', orderId);
        }
      }

      await fetchComandas();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const unpaidTotal = comandas.reduce((sum, c) => sum + c.unpaid_total, 0);
  const paidTotal = comandas.reduce((sum, c) => sum + c.paid_total, 0);
  const remainingTotal = comandas.reduce((sum, c) => sum + c.remaining_total, 0);

  return {
    comandas,
    isLoading,
    refetch: fetchComandas,
    markAsPaid,
    markAsUnpaid,
    closeComanda,
    markOrderPaid,
    markOrderUnpaid,
    addPartialPayment,
    updateDiscount,
    updateItemQuantity,
    deleteItem,
    unpaidTotal,
    paidTotal,
    remainingTotal,
  };
};
