import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProductRecipes, ProductRecipeIngredient } from '@/hooks/useProductRecipes';
import { useInventoryItems, InventoryItem } from '@/hooks/useInventoryItems';
import { MenuProduct } from '@/hooks/useMenuProducts';
import { Loader2, Plus, Trash2, Wine, Package, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

interface ProductRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: MenuProduct | null;
}

export const ProductRecipeModal: React.FC<ProductRecipeModalProps> = ({
  open,
  onOpenChange,
  product
}) => {
  const { recipes, isLoading, addIngredient, removeIngredient } = useProductRecipes(product?.id);
  const { items: inventoryItems, isLoading: loadingInventory } = useInventoryItems();
  
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [quantityMl, setQuantityMl] = useState<string>('');
  const [quantityUnits, setQuantityUnits] = useState<string>('1');
  const [isAdding, setIsAdding] = useState(false);

  // Filter out items that are already in the recipe
  const availableIngredients = useMemo(() => {
    const usedIds = new Set(recipes.map(r => r.ingredient_inventory_item_id));
    return inventoryItems.filter(i => !usedIds.has(i.id));
  }, [inventoryItems, recipes]);

  const selectedIngredientItem = useMemo(() => {
    return inventoryItems.find(i => i.id === selectedIngredient);
  }, [inventoryItems, selectedIngredient]);

  const handleAddIngredient = async () => {
    if (!selectedIngredient) {
      toast.error('Selecione um ingrediente');
      return;
    }

    // Validate based on ingredient type
    if (selectedIngredientItem?.is_bottle) {
      if (!quantityMl || parseInt(quantityMl) <= 0) {
        toast.error('Informe a quantidade em ml');
        return;
      }
    } else {
      if (!quantityUnits || parseInt(quantityUnits) <= 0) {
        toast.error('Informe a quantidade em unidades');
        return;
      }
    }

    setIsAdding(true);
    const ml = selectedIngredientItem?.is_bottle ? parseInt(quantityMl) : null;
    const units = selectedIngredientItem?.is_bottle ? 0 : (parseInt(quantityUnits) || 1);

    const { error } = await addIngredient(selectedIngredient, ml, units);
    
    if (error) {
      toast.error('Erro ao adicionar ingrediente: ' + error);
    } else {
      toast.success('Ingrediente adicionado');
      setSelectedIngredient('');
      setQuantityMl('');
      setQuantityUnits('1');
    }
    setIsAdding(false);
  };

  const handleRemove = async (recipeId: string) => {
    const { error } = await removeIngredient(recipeId);
    if (error) {
      toast.error('Erro ao remover ingrediente');
    } else {
      toast.success('Ingrediente removido');
    }
  };

  if (!product) return null;

  const loading = isLoading || loadingInventory;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Receita: {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Add new ingredient */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Label className="text-sm font-medium">Adicionar Ingrediente do Estoque</Label>
            
            <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um ingrediente..." />
              </SelectTrigger>
              <SelectContent>
                {availableIngredients.map(i => (
                  <SelectItem key={i.id} value={i.id}>
                    <span className="flex items-center gap-2">
                      {i.is_bottle ? <Wine className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                      {i.name}
                      {i.is_bottle && i.bottle_ml && (
                        <span className="text-xs text-muted-foreground">({i.bottle_ml}ml)</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedIngredientItem && (
              <div className="grid grid-cols-2 gap-2">
                {selectedIngredientItem.is_bottle ? (
                  <div>
                    <Label className="text-xs">Quantidade (ml)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={quantityMl}
                      onChange={e => setQuantityMl(e.target.value)}
                      placeholder="Ex: 100"
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs">Quantidade (unidades)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantityUnits}
                      onChange={e => setQuantityUnits(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleAddIngredient}
              disabled={!selectedIngredient || isAdding}
              size="sm"
              className="w-full"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar
            </Button>
          </div>

          {/* Current recipe ingredients */}
          <div className="flex-1 overflow-hidden">
            <Label className="text-sm font-medium">Ingredientes da Receita</Label>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum ingrediente cadastrado</p>
                <p className="text-xs">Adicione ingredientes do estoque acima</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] mt-2">
                <div className="space-y-2 pr-4">
                  {recipes.map(recipe => (
                    <div 
                      key={recipe.id} 
                      className="flex items-center justify-between p-3 border rounded-lg bg-background"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {recipe.ingredient?.is_bottle ? (
                          <Wine className="h-4 w-4 text-purple-500" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">{recipe.ingredient?.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {recipe.ingredient?.is_bottle ? (
                          <Badge variant="secondary" className="text-xs">
                            {recipe.quantity_ml || 0}ml
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {recipe.quantity_units} un
                          </Badge>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemove(recipe.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Summary */}
          {recipes.length > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg text-sm">
              <p className="font-medium text-primary">
                Ao vender "{product.name}", será decrementado do estoque:
              </p>
              <ul className="mt-1 text-xs text-muted-foreground">
                {recipes.map(r => (
                  <li key={r.id}>
                    • {r.ingredient?.name}: {r.ingredient?.is_bottle ? `${r.quantity_ml}ml` : `${r.quantity_units} un`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
