import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TableWithActivity {
  id: string;
  number: number;
  name: string;
  is_active: boolean;
  client_name: string | null;
  session_id: string | null;
  last_order_at: string | null;
  minutes_since_order: number | null;
}

export type TableStatus = 'free' | 'active' | 'attention' | 'inactive';

export const getTableStatus = (
  table: TableWithActivity,
  inactivityMinutes: number
): TableStatus => {
  if (!table.is_active) return 'inactive';
  if (!table.client_name) return 'free';
  if (table.minutes_since_order === null) {
    // Has client but no orders yet - treat as attention after threshold
    return 'attention';
  }
  if (table.minutes_since_order >= inactivityMinutes) return 'attention';
  return 'active';
};

export const useTablesWithActivity = () => {
  const [tables, setTables] = useState<TableWithActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTables = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_tables_with_activity');

      if (error) {
        console.error('Error fetching tables with activity:', error);
        return;
      }

      setTables(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchTables, 30000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  return {
    tables,
    isLoading,
    refetch: fetchTables,
  };
};
