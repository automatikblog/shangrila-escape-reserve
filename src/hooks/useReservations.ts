import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface Reservation {
  id: string;
  reservation_date: string;
  reservation_type: string;
  client_name: string;
  client_email: string;
  client_whatsapp?: string | null;
  num_people: number;
  status: string;
  created_at: string;
}

// Limites de reservas por tipo
export const RESERVATION_LIMITS: Record<string, number | null> = {
  entrada: null, // Ilimitado
  piscina: null, // Ilimitado
  quiosque: 5,   // 5 mesas
  cafe: 30,      // 30 mesas
};

export const RESERVATION_LABELS: Record<string, string> = {
  entrada: 'Entrada do clube',
  piscina: 'Piscina',
  quiosque: 'Quiosque/Churrasqueira',
  cafe: 'Café da manhã',
};

export const RESERVATION_PRICES: Record<string, number> = {
  entrada: 10,
  piscina: 20,
  quiosque: 50,
  cafe: 45,
};

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async (date?: Date) => {
    setLoading(true);
    try {
      let query = supabase
        .from('reservations')
        .select('*')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      if (date) {
        query = query.eq('reservation_date', format(date, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;
      setReservations((data as Reservation[]) || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailability = async (date: Date): Promise<Record<string, number>> => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Use security definer function to get counts without exposing PII
    const { data, error } = await supabase
      .rpc('get_reservation_counts', { p_date: dateStr });

    if (error) {
      console.error('Error fetching availability:', error);
      return { entrada: 0, piscina: 0, quiosque: 0, cafe: 0 };
    }

    // Convert array response to counts object
    const counts: Record<string, number> = { entrada: 0, piscina: 0, quiosque: 0, cafe: 0 };
    data?.forEach((r: { reservation_type: string; count: number }) => {
      if (counts[r.reservation_type] !== undefined) {
        counts[r.reservation_type] = Number(r.count);
      }
    });

    return counts;
  };

  const getRemainingSlots = (type: string, currentCount: number): number | null => {
    const limit = RESERVATION_LIMITS[type];
    if (limit === null) return null; // Ilimitado
    return Math.max(0, limit - currentCount);
  };

  const isTypeAvailable = (type: string, currentCount: number): boolean => {
    const limit = RESERVATION_LIMITS[type];
    if (limit === null) return true;
    return currentCount < limit;
  };

  const createReservation = async (reservation: Omit<Reservation, 'id' | 'created_at' | 'status'>) => {
    // Verificar disponibilidade antes de criar
    const counts = await getAvailability(new Date(reservation.reservation_date));
    
    if (!isTypeAvailable(reservation.reservation_type, counts[reservation.reservation_type] || 0)) {
      throw new Error('Tipo de reserva esgotado para esta data');
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        reservation_date: reservation.reservation_date,
        reservation_type: reservation.reservation_type,
        client_name: reservation.client_name,
        client_email: reservation.client_email,
        num_people: reservation.num_people,
        status: 'confirmed',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const cancelReservation = async (id: string) => {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;
    await fetchReservations();
  };

  const deleteReservation = async (id: string) => {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchReservations();
  };

  useEffect(() => {
    fetchReservations();

    // Realtime subscription
    const channel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => fetchReservations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    reservations,
    loading,
    fetchReservations,
    getAvailability,
    getRemainingSlots,
    isTypeAvailable,
    createReservation,
    cancelReservation,
    deleteReservation,
    RESERVATION_LIMITS,
    RESERVATION_LABELS,
    RESERVATION_PRICES,
  };
}
