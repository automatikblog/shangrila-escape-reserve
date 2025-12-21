import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Comanda, ComandaItem, ComandaOrder, PartialPayment } from './useComandas';
import { toast } from 'sonner';

interface UseHistoricalComandasOptions {
  dateFrom?: Date;
  dateTo?: Date;
  clientName?: string;
}

export interface HistoricalComanda extends Comanda {
  is_active: boolean;
}

export const useHistoricalComandas = () => {
  const [comandas, setComandas] = useState<HistoricalComanda[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistoricalComandas = useCallback(async (options?: UseHistoricalComandasOptions) => {
    setIsLoading(true);
    try {
      // Build query for client_sessions (including closed ones)
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

      // Apply date filters
      if (options?.dateFrom) {
        const fromDate = new Date(options.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        query = query.gte('created_at', fromDate.toISOString());
      }

      if (options?.dateTo) {
        const toDate = new Date(options.dateTo);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', toDate.toISOString());
      }

      // Apply client name filter
      if (options?.clientName?.trim()) {
        query = query.ilike('client_name', `%${options.clientName.trim()}%`);
      }

      const { data: sessions, error: sessionsError } = await query;

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        setComandas([]);
        return;
      }

      if (!sessions || sessions.length === 0) {
        setComandas([]);
        return;
      }

      // Fetch orders and items for each session
      const comandasWithTotals: Comanda[] = await Promise.all(
        sessions.map(async (session: any) => {
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
          // Use the higher value between paid orders and partial payments to handle both old and new payment methods
          const actualPaid = Math.max(paidTotal, partialPaymentsTotal);
          const remainingTotal = Math.max(0, total - actualPaid - sessionDiscount);

          return {
            session_id: session.id,
            client_name: session.client_name,
            table_id: session.table_id,
            table_number: session.tables.number,
            table_name: session.tables.name,
            is_paid: session.is_paid,
            paid_at: session.paid_at,
            created_at: session.created_at,
            is_active: session.is_active,
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

      setComandas(comandasWithTotals as HistoricalComanda[]);
    } catch (error) {
      console.error('Error:', error);
      setComandas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reactivateComanda = useCallback(async (sessionId: string, clientName: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('client_sessions')
        .update({ is_active: true, is_paid: false, paid_at: null })
        .eq('id', sessionId);

      if (error) {
        console.error('Error reactivating comanda:', error);
        toast.error('Erro ao reabrir comanda');
        return false;
      }

      // Remove from historical list since it's now active
      setComandas(prev => prev.filter(c => c.session_id !== sessionId));
      toast.success(`Comanda de ${clientName} reaberta com sucesso`);
      return true;
    } catch (error) {
      console.error('Error reactivating comanda:', error);
      toast.error('Erro ao reabrir comanda');
      return false;
    }
  }, []);

  return {
    comandas,
    isLoading,
    fetchComandas: fetchHistoricalComandas,
    reactivateComanda,
  };
};
