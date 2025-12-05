import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Table {
  id: string;
  number: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export const useAdminTables = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('number', { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (err: any) {
      console.error('Error fetching tables:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const createTable = async (number: number, name: string) => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({ number, name })
        .select()
        .single();

      if (error) throw error;
      setTables(prev => [...prev, data].sort((a, b) => a.number - b.number));
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating table:', err);
      return { data: null, error: err.message };
    }
  };

  const updateTable = async (id: string, updates: Partial<Table>) => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setTables(prev => prev.map(t => t.id === id ? data : t));
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating table:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteTable = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTables(prev => prev.filter(t => t.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting table:', err);
      return { error: err.message };
    }
  };

  return {
    tables,
    isLoading,
    error,
    fetchTables,
    createTable,
    updateTable,
    deleteTable
  };
};
