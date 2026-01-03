import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductRecipeIngredient {
  id: string;
  parent_product_id: string;
  ingredient_inventory_item_id: string;
  quantity_ml: number | null;
  quantity_units: number;
  created_at: string;
  // Joined data from inventory_items
  ingredient?: {
    id: string;
    name: string;
    is_bottle: boolean;
    bottle_ml: number | null;
  };
}

export const useProductRecipes = (parentProductId?: string) => {
  const [recipes, setRecipes] = useState<ProductRecipeIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecipes = useCallback(async () => {
    if (!parentProductId) {
      setRecipes([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('item_recipes')
        .select(`
          id,
          parent_product_id,
          ingredient_inventory_item_id,
          quantity_ml,
          quantity_units,
          created_at,
          ingredient:inventory_items!ingredient_inventory_item_id(id, name, is_bottle, bottle_ml)
        `)
        .eq('parent_product_id', parentProductId);

      if (error) throw error;
      
      // Filter out recipes that don't have ingredient_inventory_item_id set
      const validRecipes = (data || []).filter(r => r.ingredient_inventory_item_id);
      setRecipes(validRecipes as ProductRecipeIngredient[]);
    } catch (err) {
      console.error('Error fetching product recipes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [parentProductId]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const addIngredient = async (ingredientInventoryItemId: string, quantityMl: number | null, quantityUnits: number) => {
    if (!parentProductId) return { error: 'No parent product' };

    try {
      // Check if recipe already exists for this ingredient
      const { data: existing } = await supabase
        .from('item_recipes')
        .select('id')
        .eq('parent_product_id', parentProductId)
        .eq('ingredient_inventory_item_id', ingredientInventoryItemId)
        .maybeSingle();

      if (existing) {
        return { error: 'Ingrediente já está na receita' };
      }

      // We need to provide a dummy parent_item_id since the column is NOT NULL
      // This is a workaround until the schema is properly updated
      const insertData = {
        parent_product_id: parentProductId,
        parent_item_id: parentProductId, // Using product id as fallback for required field
        ingredient_inventory_item_id: ingredientInventoryItemId,
        ingredient_item_id: ingredientInventoryItemId, // Using inventory id as fallback
        quantity_ml: quantityMl,
        quantity_units: quantityUnits || 0
      };

      const { error } = await supabase
        .from('item_recipes')
        .insert(insertData);

      if (error) throw error;
      await fetchRecipes();
      return { error: null };
    } catch (err: any) {
      console.error('Error adding ingredient:', err);
      return { error: err.message };
    }
  };

  const updateIngredient = async (recipeId: string, quantityMl: number | null, quantityUnits: number) => {
    try {
      const { error } = await supabase
        .from('item_recipes')
        .update({ quantity_ml: quantityMl, quantity_units: quantityUnits })
        .eq('id', recipeId);

      if (error) throw error;
      await fetchRecipes();
      return { error: null };
    } catch (err: any) {
      console.error('Error updating ingredient:', err);
      return { error: err.message };
    }
  };

  const removeIngredient = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('item_recipes')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;
      await fetchRecipes();
      return { error: null };
    } catch (err: any) {
      console.error('Error removing ingredient:', err);
      return { error: err.message };
    }
  };

  const hasRecipe = recipes.length > 0;

  return {
    recipes,
    isLoading,
    hasRecipe,
    fetchRecipes,
    addIngredient,
    updateIngredient,
    removeIngredient
  };
};
