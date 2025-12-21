import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Helper to recalculate comanda totals
const recalculateComandaTotals = (comanda: Comanda): Comanda => {
  let total = 0;
  let paidTotal = 0;
  let unpaidTotal = 0;
  
  for (const order of comanda.orders) {
    const orderTotal = order.items.reduce((sum, item) => sum + (item.item_price * item.quantity), 0);
    total += orderTotal;
    if (order.is_paid) {
      paidTotal += orderTotal;
    } else {
      unpaidTotal += orderTotal;
    }
  }
  
  const partialPaymentsTotal = comanda.partial_payments.reduce((sum, pp) => sum + Number(pp.amount), 0);
  const remainingTotal = Math.max(0, total - paidTotal - partialPaymentsTotal - comanda.discount);
  
  return {
    ...comanda,
    total,
    paid_total: paidTotal,
    unpaid_total: unpaidTotal,
    partial_payments_total: partialPaymentsTotal,
    remaining_total: remainingTotal,
  };
};

export const useComandas = (options?: UseComandaOptions) => {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const comandasRef = useRef<Comanda[]>([]);
  
  // Keep ref in sync with state for use in async callbacks
  comandasRef.current = comandas;
  
  // Safe setState that only updates if mounted
  const safeSetComandas = useCallback((updater: Comanda[] | ((prev: Comanda[]) => Comanda[])) => {
    if (isMountedRef.current) {
      setComandas(updater);
    }
  }, []);

  // FASE 2: Optimized fetchComandas with batch queries (3-4 queries instead of N+1)
  const fetchComandas = useCallback(async () => {
    try {
      // Query 1: Get all sessions with tables
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

      if (options?.activeOnly !== false) {
        query = query.eq('is_active', true);
      }

      const { data: sessions, error: sessionsError } = await query;

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        return;
      }

      if (!sessions || sessions.length === 0) {
        safeSetComandas([]);
        return;
      }

      // Filter by table number if specified
      let filteredSessions = sessions;
      if (options?.tableNumber !== undefined) {
        filteredSessions = sessions.filter(
          (s: any) => s.tables.number === options.tableNumber
        );
      }

      if (filteredSessions.length === 0) {
        safeSetComandas([]);
        return;
      }

      const sessionIds = filteredSessions.map((s: any) => s.id);

      // Query 2: Get ALL orders for all sessions at once
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, client_session_id, notes, delivery_type, created_at, is_paid, paid_at, payment_method')
        .in('client_session_id', sessionIds)
        .order('created_at', { ascending: true });

      // Query 3: Get ALL order items for all orders at once
      const orderIds = (allOrders || []).map((o: any) => o.id);
      const { data: allItems } = orderIds.length > 0 
        ? await supabase
            .from('order_items')
            .select('id, order_id, item_name, item_price, quantity, created_at')
            .in('order_id', orderIds)
        : { data: [] };

      // Query 4: Get ALL partial payments for all sessions at once
      const { data: allPartialPayments } = await supabase
        .from('partial_payments')
        .select('id, client_session_id, amount, notes, created_at, payment_method')
        .in('client_session_id', sessionIds)
        .order('created_at', { ascending: true });

      // Group data in memory (MUCH faster than N+1 queries)
      const ordersBySession = new Map<string, any[]>();
      const itemsByOrder = new Map<string, ComandaItem[]>();
      const paymentsBySession = new Map<string, PartialPayment[]>();

      for (const order of (allOrders || [])) {
        const existing = ordersBySession.get(order.client_session_id) || [];
        existing.push(order);
        ordersBySession.set(order.client_session_id, existing);
      }

      for (const item of (allItems || [])) {
        const existing = itemsByOrder.get(item.order_id) || [];
        existing.push({
          id: item.id,
          item_name: item.item_name,
          item_price: item.item_price,
          quantity: item.quantity,
          created_at: item.created_at,
        });
        itemsByOrder.set(item.order_id, existing);
      }

      for (const payment of (allPartialPayments || [])) {
        const existing = paymentsBySession.get(payment.client_session_id) || [];
        existing.push({
          id: payment.id,
          amount: payment.amount,
          notes: payment.notes,
          payment_method: payment.payment_method,
          created_at: payment.created_at,
        });
        paymentsBySession.set(payment.client_session_id, existing);
      }

      // Build comandas from grouped data
      const comandasWithTotals: Comanda[] = filteredSessions.map((session: any) => {
        const sessionOrders = ordersBySession.get(session.id) || [];
        const partialPayments = paymentsBySession.get(session.id) || [];
        const partialPaymentsTotal = partialPayments.reduce((sum, pp) => sum + Number(pp.amount), 0);

        let total = 0;
        let paidTotal = 0;
        let unpaidTotal = 0;
        let allSessionItems: ComandaItem[] = [];
        const ordersWithItems: ComandaOrder[] = [];

        for (const order of sessionOrders) {
          const items = itemsByOrder.get(order.id) || [];
          const orderTotal = items.reduce((sum, item) => sum + (item.item_price * item.quantity), 0);
          total += orderTotal;

          if (order.is_paid) {
            paidTotal += orderTotal;
          } else {
            unpaidTotal += orderTotal;
          }

          allSessionItems = [...allSessionItems, ...items];

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
          items: allSessionItems,
          orders: ordersWithItems,
          partial_payments: partialPayments,
        };
      });

      safeSetComandas(comandasWithTotals);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [options?.tableNumber, options?.activeOnly, safeSetComandas]);

  // FASE 3: Debounced fetch for realtime updates
  const debouncedFetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchComandas();
    }, 500);
  }, [fetchComandas]);

  useEffect(() => {
    fetchComandas();
    
    const channelName = `comandas-realtime-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_sessions' },
        () => debouncedFetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => debouncedFetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => debouncedFetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partial_payments' },
        () => debouncedFetch()
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchComandas, debouncedFetch]);

  // FASE 1: Optimistic update functions

  const markAsPaid = useCallback(async (sessionId: string): Promise<boolean> => {
    // Optimistic update
    safeSetComandas(prev => prev.map(c => 
      c.session_id === sessionId 
        ? { ...c, is_paid: true, paid_at: new Date().toISOString() }
        : c
    ));

    // Background sync
    const { error } = await supabase
      .from('client_sessions')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('Error marking as paid:', error);
      toast.error('Erro ao salvar. Recarregando...');
      fetchComandas();
      return false;
    }
    return true;
  }, [safeSetComandas, fetchComandas]);

  const markAsUnpaid = useCallback(async (sessionId: string): Promise<boolean> => {
    safeSetComandas(prev => prev.map(c => 
      c.session_id === sessionId 
        ? { ...c, is_paid: false, paid_at: null }
        : c
    ));

    const { error } = await supabase
      .from('client_sessions')
      .update({ is_paid: false, paid_at: null })
      .eq('id', sessionId);

    if (error) {
      console.error('Error marking as unpaid:', error);
      toast.error('Erro ao salvar. Recarregando...');
      fetchComandas();
      return false;
    }
    return true;
  }, [safeSetComandas, fetchComandas]);

  const closeComanda = useCallback(async (sessionId: string): Promise<boolean> => {
    // Optimistic: remove from list
    safeSetComandas(prev => prev.filter(c => c.session_id !== sessionId));

    const { error } = await supabase
      .from('client_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) {
      console.error('Error closing comanda:', error);
      toast.error('Erro ao fechar. Recarregando...');
      fetchComandas();
      return false;
    }
    return true;
  }, [safeSetComandas, fetchComandas]);

  const markOrderPaid = useCallback(async (orderId: string, paymentMethod?: string): Promise<boolean> => {
    const now = new Date().toISOString();
    
    // Optimistic update
    safeSetComandas(prev => prev.map(comanda => {
      const hasOrder = comanda.orders.some(o => o.id === orderId);
      if (!hasOrder) return comanda;

      const updatedOrders = comanda.orders.map(order => 
        order.id === orderId 
          ? { ...order, is_paid: true, paid_at: now, payment_method: paymentMethod || null }
          : order
      );

      return recalculateComandaTotals({ ...comanda, orders: updatedOrders });
    }));

    // Background sync
    const { error } = await supabase
      .from('orders')
      .update({ is_paid: true, paid_at: now, payment_method: paymentMethod || null })
      .eq('id', orderId);

    if (error) {
      console.error('Error marking order as paid:', error);
      toast.error('Erro ao salvar. Recarregando...');
      fetchComandas();
      return false;
    }
    return true;
  }, [safeSetComandas, fetchComandas]);

  const markOrderUnpaid = useCallback(async (orderId: string): Promise<boolean> => {
    // Optimistic update
    safeSetComandas(prev => prev.map(comanda => {
      const hasOrder = comanda.orders.some(o => o.id === orderId);
      if (!hasOrder) return comanda;

      const updatedOrders = comanda.orders.map(order => 
        order.id === orderId 
          ? { ...order, is_paid: false, paid_at: null }
          : order
      );

      return recalculateComandaTotals({ ...comanda, orders: updatedOrders });
    }));

    const { error } = await supabase
      .from('orders')
      .update({ is_paid: false, paid_at: null })
      .eq('id', orderId);

    if (error) {
      console.error('Error marking order as unpaid:', error);
      toast.error('Erro ao salvar. Recarregando...');
      fetchComandas();
      return false;
    }
    return true;
  }, [safeSetComandas, fetchComandas]);

  const addPartialPayment = useCallback(async (
    sessionId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ): Promise<boolean> => {
    const tempId = `temp-${Date.now()}`;
    const newPayment: PartialPayment = {
      id: tempId,
      amount,
      notes: notes || null,
      payment_method: paymentMethod,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    safeSetComandas(prev => prev.map(comanda => {
      if (comanda.session_id !== sessionId) return comanda;
      
      const updatedPayments = [...comanda.partial_payments, newPayment];
      return recalculateComandaTotals({ ...comanda, partial_payments: updatedPayments });
    }));

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
      toast.error('Erro ao salvar. Recarregando...');
      fetchComandas();
      return false;
    }
    
    // Fetch to get real ID
    debouncedFetch();
    return true;
  }, [safeSetComandas, fetchComandas, debouncedFetch]);

  const updateDiscount = useCallback(async (sessionId: string, discount: number): Promise<boolean> => {
    // Optimistic update
    safeSetComandas(prev => prev.map(comanda => {
      if (comanda.session_id !== sessionId) return comanda;
      return recalculateComandaTotals({ ...comanda, discount });
    }));

    const { error } = await supabase
      .from('client_sessions')
      .update({ discount })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating discount:', error);
      toast.error('Erro ao salvar. Recarregando...');
      fetchComandas();
      return false;
    }

    // Check if we should mark as paid using ref to avoid stale closure
    const comanda = comandasRef.current.find(c => c.session_id === sessionId);
    if (comanda) {
      const newRemaining = Math.max(0, comanda.total - comanda.paid_total - comanda.partial_payments_total - discount);
      if (newRemaining === 0 && !comanda.is_paid) {
        await supabase
          .from('client_sessions')
          .update({ is_paid: true, paid_at: new Date().toISOString() })
          .eq('id', sessionId);
      }
    }

    return true;
  }, [safeSetComandas, fetchComandas]);

  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    // Find the item and order info before optimistic update using ref
    let targetOrderId: string | null = null;
    let orderItemCount = 0;

    for (const comanda of comandasRef.current) {
      for (const order of comanda.orders) {
        const item = order.items.find(i => i.id === itemId);
        if (item) {
          targetOrderId = order.id;
          orderItemCount = order.items.length;
          break;
        }
      }
      if (targetOrderId) break;
    }

    // Optimistic update
    safeSetComandas(prev => prev.map(comanda => {
      let modified = false;
      let updatedOrders = comanda.orders.map(order => {
        const filteredItems = order.items.filter(item => item.id !== itemId);
        if (filteredItems.length !== order.items.length) {
          modified = true;
          const orderTotal = filteredItems.reduce((sum, item) => sum + (item.item_price * item.quantity), 0);
          return { ...order, items: filteredItems, order_total: orderTotal };
        }
        return order;
      });

      // Remove empty orders
      updatedOrders = updatedOrders.filter(order => order.items.length > 0);

      if (!modified) return comanda;

      const allItems = updatedOrders.flatMap(o => o.items);
      return recalculateComandaTotals({ ...comanda, orders: updatedOrders, items: allItems });
    }));

    // Background sync
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
      toast.error('Erro ao deletar. Recarregando...');
      fetchComandas();
      return false;
    }

    // If this was the last item in the order, delete the order too
    if (targetOrderId && orderItemCount === 1) {
      await supabase
        .from('orders')
        .delete()
        .eq('id', targetOrderId);
    }

    return true;
  }, [safeSetComandas, fetchComandas]);

  const updateItemQuantity = useCallback(async (itemId: string, newQuantity: number): Promise<boolean> => {
    if (newQuantity <= 0) {
      return deleteItem(itemId);
    }

    // Optimistic update
    safeSetComandas(prev => prev.map(comanda => {
      let found = false;
      const updatedOrders = comanda.orders.map(order => {
        const updatedItems = order.items.map(item => {
          if (item.id === itemId) {
            found = true;
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
        if (found) {
          const orderTotal = updatedItems.reduce((sum, item) => sum + (item.item_price * item.quantity), 0);
          return { ...order, items: updatedItems, order_total: orderTotal };
        }
        return order;
      });

      if (!found) return comanda;
      return recalculateComandaTotals({ ...comanda, orders: updatedOrders });
    }));

    const { error } = await supabase
      .from('order_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating item quantity:', error);
      toast.error('Erro ao salvar. Recarregando...');
      fetchComandas();
      return false;
    }
    return true;
  }, [safeSetComandas, fetchComandas, deleteItem]);

  const unpaidTotal = useMemo(() => comandas.reduce((sum, c) => sum + c.unpaid_total, 0), [comandas]);
  const paidTotal = useMemo(() => comandas.reduce((sum, c) => sum + c.paid_total, 0), [comandas]);
  const remainingTotal = useMemo(() => comandas.reduce((sum, c) => sum + c.remaining_total, 0), [comandas]);

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
