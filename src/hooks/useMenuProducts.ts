import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MenuProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  is_available: boolean;
  goes_to_kitchen: boolean;
  is_customizable: boolean;
  inventory_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuProductInput {
  name: string;
  description?: string | null;
  category: string;
  price: number;
  is_available?: boolean;
  goes_to_kitchen?: boolean;
  is_customizable?: boolean;
  inventory_item_id?: string | null;
}

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

export const useMenuProducts = () => {
  const [items, setItems] = useState<MenuProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('menu_products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setItems((data as MenuProduct[]) || []);
    } catch (err: any) {
      console.error('Error fetching menu products:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (item: MenuProductInput) => {
    try {
      const { data, error } = await supabase
        .from('menu_products')
        .insert({
          ...item,
          is_available: item.is_available ?? true,
          goes_to_kitchen: item.goes_to_kitchen ?? true,
          is_customizable: item.is_customizable ?? false
        } as any)
        .select()
        .single();

      if (error) throw error;
      setItems(prev => [...prev, data as MenuProduct]);
      return { data: data as MenuProduct, error: null };
    } catch (err: any) {
      console.error('Error creating menu product:', err);
      return { data: null, error: err.message };
    }
  };

  const updateItem = async (id: string, updates: Partial<MenuProductInput>) => {
    try {
      const { data, error } = await supabase
        .from('menu_products')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setItems(prev => prev.map(item => item.id === id ? (data as MenuProduct) : item));
      return { data: data as MenuProduct, error: null };
    } catch (err: any) {
      console.error('Error updating menu product:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting menu product:', err);
      return { error: err.message };
    }
  };

  // Link product to inventory item (for stock depletion)
  const linkToInventory = async (productId: string, inventoryItemId: string | null) => {
    return await updateItem(productId, { inventory_item_id: inventoryItemId });
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
    linkToInventory
  };
};

// Hook for customer-facing menu (only available products)
export const usePublicMenuProducts = () => {
  const [items, setItems] = useState<MenuProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('menu_products')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setItems((data as MenuProduct[]) || []);
    } catch (err: any) {
      console.error('Error fetching public menu products:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const categories = [...new Set(items.map(item => item.category))];

  return {
    items,
    categories,
    isLoading,
    error,
    fetchItems
  };
};
