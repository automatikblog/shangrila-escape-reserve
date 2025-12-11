import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ComandaItem {
  item_name: string;
  item_price: number;
  quantity: number;
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
  total: number;
  items: ComandaItem[];
}

export const useComandas = () => {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComandas = useCallback(async () => {
    try {
      // Get start of today in local timezone (Brazil)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch active sessions for today
      const { data: sessions, error: sessionsError } = await supabase
        .from('client_sessions')
        .select(`
          id,
          client_name,
          table_id,
          is_paid,
          paid_at,
          created_at,
          tables!inner (
            number,
            name
          )
        `)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
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
            .select('id')
            .eq('client_session_id', session.id);

          let total = 0;
          let items: ComandaItem[] = [];

          if (orders && orders.length > 0) {
            const orderIds = orders.map(o => o.id);
            
            const { data: orderItems } = await supabase
              .from('order_items')
              .select('item_name, item_price, quantity')
              .in('order_id', orderIds);

            if (orderItems) {
              items = orderItems;
              total = orderItems.reduce(
                (sum, item) => sum + (item.item_price * item.quantity),
                0
              );
            }
          }

          return {
            session_id: session.id,
            client_name: session.client_name,
            table_id: session.table_id,
            table_number: session.tables.number,
            table_name: session.tables.name,
            is_paid: session.is_paid,
            paid_at: session.paid_at,
            created_at: session.created_at,
            total,
            items,
          };
        })
      );

      setComandas(comandasWithTotals);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComandas();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchComandas, 30000);
    return () => clearInterval(interval);
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

  const unpaidTotal = comandas
    .filter(c => !c.is_paid)
    .reduce((sum, c) => sum + c.total, 0);

  const paidTotal = comandas
    .filter(c => c.is_paid)
    .reduce((sum, c) => sum + c.total, 0);

  return {
    comandas,
    isLoading,
    refetch: fetchComandas,
    markAsPaid,
    markAsUnpaid,
    closeComanda,
    unpaidTotal,
    paidTotal,
  };
};
