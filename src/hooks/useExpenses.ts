import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  expense_date: string;
  payment_method: string | null;
  paid_by: string | null;
  status: 'paid' | 'pending';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface ExpensePayer {
  id: string;
  name: string;
  created_at: string;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: 'paid' | 'pending' | 'all';
}

export function useExpenses(filters?: ExpenseFilters) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [payers, setPayers] = useState<ExpensePayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchExpenses = async () => {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('expense_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('expense_date', filters.endDate);
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExpenses(data as Expense[]);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: 'Erro ao carregar gastos',
        description: 'Não foi possível carregar os gastos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data as ExpenseCategory[]);
    }
  };

  const fetchPayers = async () => {
    const { data, error } = await supabase
      .from('expense_payers')
      .select('*')
      .order('name');

    if (!error && data) {
      setPayers(data as ExpensePayer[]);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchPayers();
  }, [filters?.startDate, filters?.endDate, filters?.category, filters?.status]);

  const createExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erro ao criar gasto',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    await fetchExpenses();
    toast({ title: 'Gasto registrado com sucesso!' });
    return data;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const { error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao atualizar gasto',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await fetchExpenses();
    toast({ title: 'Gasto atualizado!' });
    return true;
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao excluir gasto',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await fetchExpenses();
    toast({ title: 'Gasto excluído!' });
    return true;
  };

  const getExpenseNameSuggestions = async (search: string): Promise<string[]> => {
    if (!search || search.length < 2) return [];

    const { data } = await supabase
      .from('expenses')
      .select('name')
      .ilike('name', `%${search}%`)
      .limit(10);

    if (!data) return [];

    // Get unique names
    const uniqueNames = [...new Set(data.map(e => e.name))];
    return uniqueNames;
  };

  const getLastExpenseByName = async (name: string): Promise<Expense | null> => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('name', name)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data as Expense | null;
  };

  const createCategory = async (name: string) => {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert({ name })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'Categoria já existe',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar categoria',
          description: error.message,
          variant: 'destructive',
        });
      }
      return null;
    }

    await fetchCategories();
    toast({ title: 'Categoria criada!' });
    return data;
  };

  const createPayer = async (name: string) => {
    const { data, error } = await supabase
      .from('expense_payers')
      .insert({ name })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'Pagador já existe',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar pagador',
          description: error.message,
          variant: 'destructive',
        });
      }
      return null;
    }

    await fetchPayers();
    toast({ title: 'Pagador cadastrado!' });
    return data;
  };

  // Calculate totals
  const totals = {
    total: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    paid: expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + Number(e.amount), 0),
    pending: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0),
  };

  // Calculate by category
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  return {
    expenses,
    categories,
    payers,
    isLoading,
    totals,
    byCategory,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseNameSuggestions,
    getLastExpenseByName,
    createCategory,
    createPayer,
    refetch: fetchExpenses,
  };
}
