import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  product_code: string[] | null;
  stock_quantity: number | null;
  cost_price: number | null;
  // Bottle/dose fields
  is_bottle: boolean;
  bottle_ml: number | null;
  dose_ml: number | null;
  bottles_in_stock: number;
  current_bottle_ml: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemInput {
  name: string;
  description?: string | null;
  product_code?: string[] | null;
  stock_quantity?: number | null;
  cost_price?: number | null;
  is_bottle?: boolean;
  bottle_ml?: number | null;
  dose_ml?: number | null;
  bottles_in_stock?: number;
  current_bottle_ml?: number;
}

export const useInventoryItems = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setItems((data as InventoryItem[]) || []);
    } catch (err: any) {
      console.error('Error fetching inventory items:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (item: InventoryItemInput) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(item as any)
        .select()
        .single();

      if (error) throw error;
      setItems(prev => [...prev, data as InventoryItem].sort((a, b) => 
        a.name.localeCompare(b.name, 'pt-BR')
      ));
      return { data: data as InventoryItem, error: null };
    } catch (err: any) {
      console.error('Error creating inventory item:', err);
      return { data: null, error: err.message };
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItemInput>) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setItems(prev => prev.map(item => item.id === id ? (data as InventoryItem) : item));
      return { data: data as InventoryItem, error: null };
    } catch (err: any) {
      console.error('Error updating inventory item:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting inventory item:', err);
      return { error: err.message };
    }
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

  // Get stock display for an item
  const getStockDisplay = (item: InventoryItem) => {
    if (item.is_bottle) {
      const bottles = item.bottles_in_stock || 0;
      const currentMl = item.current_bottle_ml || 0;
      return { bottles, currentMl, isOutOfStock: bottles === 0 && currentMl === 0 };
    }

    return { 
      quantity: item.stock_quantity, 
      isOutOfStock: item.stock_quantity !== null && item.stock_quantity <= 0 
    };
  };

  return {
    items,
    isLoading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    addProductCode,
    getStockDisplay
  };
};
