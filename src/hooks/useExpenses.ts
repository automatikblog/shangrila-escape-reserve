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

export interface RecurringExpense {
  id: string;
  name: string;
  category: string;
  amount: number;
  payment_method: string | null;
  paid_by: string | null;
  notes: string | null;
  days_of_week: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const { toast } = useToast();

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
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

  const fetchRecurringExpenses = async () => {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .order('name');

    if (!error && data) {
      setRecurringExpenses(data as RecurringExpense[]);
    }
  };

  // Fetch expenses when filters change
  useEffect(() => {
    fetchExpenses();
  }, [filters?.startDate, filters?.endDate, filters?.category, filters?.status]);

  // Fetch categories, payers, and recurring only once
  useEffect(() => {
    if (!hasLoadedInitialData) {
      fetchCategories();
      fetchPayers();
      fetchRecurringExpenses();
      setHasLoadedInitialData(true);
    }
  }, [hasLoadedInitialData]);

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

  // Get all unique expense names for selection
  const getAllExpenseNames = async (): Promise<Expense[]> => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!data) return [];

    // Get unique names with their last expense data
    const uniqueMap = new Map<string, Expense>();
    data.forEach(e => {
      if (!uniqueMap.has(e.name)) {
        uniqueMap.set(e.name, e as Expense);
      }
    });

    return Array.from(uniqueMap.values());
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

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao excluir categoria',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await fetchCategories();
    toast({ title: 'Categoria excluída!' });
    return true;
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

  // Recurring expenses functions
  const createRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert(expense)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erro ao criar gasto recorrente',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    await fetchRecurringExpenses();
    toast({ title: 'Gasto recorrente criado!' });
    return data;
  };

  const updateRecurringExpense = async (id: string, updates: Partial<RecurringExpense>) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao atualizar gasto recorrente',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await fetchRecurringExpenses();
    toast({ title: 'Gasto recorrente atualizado!' });
    return true;
  };

  const deleteRecurringExpense = async (id: string) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao excluir gasto recorrente',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await fetchRecurringExpenses();
    toast({ title: 'Gasto recorrente excluído!' });
    return true;
  };

  const applyRecurringExpense = async (recurring: RecurringExpense, date: string) => {
    return createExpense({
      name: recurring.name,
      category: recurring.category,
      amount: recurring.amount,
      expense_date: date,
      payment_method: recurring.payment_method,
      paid_by: recurring.paid_by,
      status: 'paid',
      notes: recurring.notes,
    });
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
    recurringExpenses,
    isLoading,
    totals,
    byCategory,
    createExpense,
    updateExpense,
    deleteExpense,
    getAllExpenseNames,
    getExpenseNameSuggestions,
    getLastExpenseByName,
    createCategory,
    deleteCategory,
    createPayer,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    applyRecurringExpense,
    refetch: fetchExpenses,
  };
}
