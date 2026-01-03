import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecipeIngredient {
  id: string;
  parent_item_id: string;
  ingredient_item_id: string;
  quantity_ml: number | null;
  quantity_units: number;
  created_at: string;
  // Joined data
  ingredient?: {
    id: string;
    name: string;
    is_bottle: boolean;
    bottle_ml: number | null;
  };
}

export const useItemRecipes = (parentItemId?: string) => {
  const [recipes, setRecipes] = useState<RecipeIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecipes = useCallback(async () => {
    if (!parentItemId) {
      setRecipes([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('item_recipes')
        .select(`
          *,
          ingredient:inventory_items!ingredient_inventory_item_id(id, name, is_bottle, bottle_ml)
        `)
        .or(`parent_item_id.eq.${parentItemId},parent_product_id.eq.${parentItemId}`);

      if (error) throw error;
      // Filter to only include recipes with inventory items and cast properly
      const validRecipes = (data || []).filter(r => r.ingredient_inventory_item_id);
      setRecipes(validRecipes as unknown as RecipeIngredient[]);
    } catch (err) {
      console.error('Error fetching recipes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [parentItemId]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const addIngredient = async (ingredientItemId: string, quantityMl: number | null, quantityUnits: number) => {
    if (!parentItemId) return { error: 'No parent item' };

    try {
      const { error } = await supabase
        .from('item_recipes')
        .insert({
          parent_item_id: parentItemId,
          ingredient_item_id: ingredientItemId,
          quantity_ml: quantityMl,
          quantity_units: quantityUnits
        });

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
