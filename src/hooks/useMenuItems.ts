import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
  is_available: boolean;
  stock_quantity: number | null;
  created_at: string;
}

export interface MenuItemInput {
  name: string;
  price: number;
  description?: string | null;
  category: string;
  is_available?: boolean;
  stock_quantity?: number | null;
}

export const useMenuItems = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching menu items:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (item: MenuItemInput) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      setItems(prev => [...prev, data]);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating menu item:', err);
      return { data: null, error: err.message };
    }
  };

  const updateItem = async (id: string, updates: Partial<MenuItemInput>) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setItems(prev => prev.map(item => item.id === id ? data : item));
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating menu item:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting menu item:', err);
      return { error: err.message };
    }
  };

  const decrementStock = async (itemId: string, quantity: number) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item || item.stock_quantity === null) return { error: null };

      const newStock = Math.max(0, item.stock_quantity - quantity);
      const updates: Partial<MenuItemInput> = { stock_quantity: newStock };
      
      if (newStock === 0) {
        updates.is_available = false;
      }

      return await updateItem(itemId, updates);
    } catch (err: any) {
      console.error('Error decrementing stock:', err);
      return { error: err.message };
    }
  };

  const categories = [...new Set(items.map(item => item.category))];

  return {
    items,
    categories,
    isLoading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    decrementStock
  };
};

export const categoryLabels: Record<string, string> = {
  'cachacas': 'Cachaças e Aguardentes',
  'licores': 'Licores e Destilados',
  'whiskies': 'Whiskies',
  'vodka': 'Vodka',
  'cervejas-garrafa': 'Cervejas - Garrafa 600ml',
  'cervejas-lata': 'Cervejas - Lata e Long Neck',
  'cervejas-zero': 'Cervejas Zero Álcool',
  'refrigerantes-lata': 'Refrigerantes - Lata',
  'refrigerantes-garrafa': 'Refrigerantes - Garrafa 2L',
  'caipirinhas-limao': 'Caipirinhas de Limão',
  'caipirinhas-cambuci': 'Caipirinhas de Cambuci',
  'caipirinhas-shangrila': 'Caipirinhas Shangri-La',
  'drinks': 'Drinks Especiais',
  'bebidas-mistas': 'Bebidas Mistas',
  'energeticos': 'Energéticos',
  'aguas': 'Águas e Hidratação',
  'sucos': 'Sucos e Diversos',
  'porcoes': 'Porções',
  'lanches-tradicionais': 'Lanches Tradicionais (55g)',
  'lanches-gourmet': 'Lanches Gourmet (150g)',
  'baldes': 'Baldes Promocionais',
  'churrasqueira': 'Churrasqueira',
  'sobremesas': 'Sobremesas'
};
