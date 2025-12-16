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
  // Bottle/dose fields
  product_code: string[] | null;
  is_bottle: boolean;
  bottle_ml: number | null;
  dose_ml: number | null;
  bottles_in_stock: number | null;
  current_bottle_ml: number | null;
  cost_price: number | null;
  // Kitchen & recipe fields
  goes_to_kitchen: boolean;
  is_customizable: boolean;
  default_recipe_suggestion: unknown | null;
  // Sellable flag - true = appears on menu for ordering, false = inventory only
  is_sellable: boolean;
}

export interface MenuItemInput {
  name: string;
  price: number;
  description?: string | null;
  category: string;
  is_available?: boolean;
  stock_quantity?: number | null;
  product_code?: string[] | null;
  is_bottle?: boolean;
  bottle_ml?: number | null;
  dose_ml?: number | null;
  bottles_in_stock?: number | null;
  current_bottle_ml?: number | null;
  cost_price?: number | null;
  // Kitchen & recipe fields
  goes_to_kitchen?: boolean;
  is_customizable?: boolean;
  default_recipe_suggestion?: unknown | null;
  // Sellable flag
  is_sellable?: boolean;
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
      setItems((data as MenuItem[]) || []);
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
        .insert(item as any)
        .select()
        .single();

      if (error) throw error;
      setItems(prev => [...prev, data as MenuItem]);
      return { data: data as MenuItem, error: null };
    } catch (err: any) {
      console.error('Error creating menu item:', err);
      return { data: null, error: err.message };
    }
  };

  const updateItem = async (id: string, updates: Partial<MenuItemInput>) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setItems(prev => prev.map(item => item.id === id ? (data as MenuItem) : item));
      return { data: data as MenuItem, error: null };
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
      const { error } = await supabase.rpc('decrement_stock', {
        p_menu_item_id: itemId,
        p_quantity: quantity
      });

      if (error) throw error;
      await fetchItems();
      return { error: null };
    } catch (err: any) {
      console.error('Error decrementing stock:', err);
      return { error: err.message };
    }
  };

  // Calculate available doses for a bottle item
  const getAvailableDoses = (item: MenuItem): number | null => {
    if (!item.is_bottle || !item.dose_ml || item.dose_ml <= 0) return null;
    
    const bottlesMl = (item.bottles_in_stock || 0) * (item.bottle_ml || 0);
    const currentMl = item.current_bottle_ml || 0;
    const totalMl = bottlesMl + currentMl;
    
    return Math.floor(totalMl / item.dose_ml);
  };

  // Add a new code to an item's product_code array
  const addProductCode = async (itemId: string, newCode: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return { error: 'Item not found' };
    
    const existingCodes = item.product_code || [];
    if (existingCodes.includes(newCode)) {
      return { error: null }; // Code already exists
    }
    
    const updatedCodes = [...existingCodes, newCode];
    return await updateItem(itemId, { product_code: updatedCodes });
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
    decrementStock,
    getAvailableDoses,
    addProductCode
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
  'sobremesas': 'Sobremesas',
  'servicos': 'Serviços'
};
