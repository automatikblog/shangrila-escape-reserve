import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MenuItem } from '@/hooks/useMenuItems';
import { Plus, Trash2, Wine, Package, Beaker, Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomIngredient {
  item_id: string;
  item_name: string;
  quantity_ml: number | null;
  quantity_units: number;
  is_bottle: boolean;
}

interface CustomItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  allItems: MenuItem[];
  onConfirm: (ingredients: CustomIngredient[]) => void;
}

export const CustomItemModal: React.FC<CustomItemModalProps> = ({
  open,
  onOpenChange,
  item,
  allItems,
  onConfirm
}) => {
  const [ingredients, setIngredients] = useState<CustomIngredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [quantityMl, setQuantityMl] = useState<string>('');
  const [quantityUnits, setQuantityUnits] = useState<string>('1');
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Parse default suggestions when item changes
  React.useEffect(() => {
    if (item?.default_recipe_suggestion) {
      try {
        const suggestions = item.default_recipe_suggestion as CustomIngredient[];
        if (Array.isArray(suggestions)) {
          // Map suggestions to actual items
          const mapped = suggestions.map(s => {
            const foundItem = allItems.find(i => i.id === s.item_id);
            if (foundItem) {
              return {
                item_id: foundItem.id,
                item_name: foundItem.name,
                quantity_ml: s.quantity_ml,
                quantity_units: s.quantity_units || 1,
                is_bottle: foundItem.is_bottle
              };
            }
            return null;
          }).filter(Boolean) as CustomIngredient[];
          setIngredients(mapped);
        }
      } catch {
        setIngredients([]);
      }
    } else {
      setIngredients([]);
    }
  }, [item, allItems]);

  // Available ingredients (bottles and regular items)
  const availableIngredients = useMemo(() => {
    const usedIds = new Set(ingredients.map(i => i.item_id));
    return allItems.filter(i => 
      i.id !== item?.id && 
      !usedIds.has(i.id) &&
      (i.is_bottle || i.stock_quantity !== 0) // Has stock or is bottle
    );
  }, [allItems, ingredients, item]);

  const selectedIngredientItem = useMemo(() => {
    return allItems.find(i => i.id === selectedIngredient);
  }, [allItems, selectedIngredient]);

  const handleAddIngredient = () => {
    if (!selectedIngredientItem) return;

    const newIngredient: CustomIngredient = {
      item_id: selectedIngredientItem.id,
      item_name: selectedIngredientItem.name,
      quantity_ml: selectedIngredientItem.is_bottle ? (parseInt(quantityMl) || 50) : null,
      quantity_units: !selectedIngredientItem.is_bottle ? (parseInt(quantityUnits) || 1) : 1,
      is_bottle: selectedIngredientItem.is_bottle
    };

    setIngredients([...ingredients, newIngredient]);
    setSelectedIngredient('');
    setQuantityMl('');
    setQuantityUnits('1');
  };

  const handleRemoveIngredient = (itemId: string) => {
    setIngredients(ingredients.filter(i => i.item_id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, value: string, isMl: boolean) => {
    setIngredients(ingredients.map(i => {
      if (i.item_id === itemId) {
        return {
          ...i,
          quantity_ml: isMl ? (parseInt(value) || 0) : i.quantity_ml,
          quantity_units: !isMl ? (parseInt(value) || 1) : i.quantity_units
        };
      }
      return i;
    }));
  };

  const handleConfirm = () => {
    onConfirm(ingredients);
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-primary" />
            Montar: {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Add ingredient section */}
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <Label className="text-sm font-medium">Adicionar Ingrediente</Label>
            
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                >
                  {selectedIngredientItem ? (
                    <span className="flex items-center gap-2">
                      {selectedIngredientItem.is_bottle ? <Wine className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                      {selectedIngredientItem.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Search className="h-3 w-3" />
                      Buscar ingrediente...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Digite para buscar..." />
                  <CommandList>
                    <CommandEmpty>Nenhum ingrediente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {availableIngredients.map(i => (
                        <CommandItem
                          key={i.id}
                          value={i.name}
                          onSelect={() => {
                            setSelectedIngredient(i.id);
                            setComboboxOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedIngredient === i.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {i.is_bottle ? <Wine className="h-3 w-3 mr-2 text-purple-500" /> : <Package className="h-3 w-3 mr-2 text-muted-foreground" />}
                          {i.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedIngredientItem && (
              <div className="flex gap-2">
                {selectedIngredientItem.is_bottle ? (
                  <div className="flex-1">
                    <Label className="text-xs">ml</Label>
                    <Input
                      type="number"
                      min="0"
                      value={quantityMl}
                      onChange={e => setQuantityMl(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <Label className="text-xs">Unidades</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantityUnits}
                      onChange={e => setQuantityUnits(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                )}
                <Button
                  onClick={handleAddIngredient}
                  size="icon"
                  className="mt-5"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Current ingredients list */}
          <div className="flex-1 overflow-hidden">
            <Label className="text-sm font-medium">
              Ingredientes Selecionados ({ingredients.length})
            </Label>
            
            {ingredients.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Adicione ingredientes acima
              </div>
            ) : (
              <ScrollArea className="h-[180px] mt-2">
                <div className="space-y-2 pr-4">
                  {ingredients.map(ing => (
                    <div 
                      key={ing.item_id} 
                      className="flex items-center gap-2 p-2 border rounded-lg bg-background"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {ing.is_bottle ? (
                          <Wine className="h-4 w-4 text-purple-500 shrink-0" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">{ing.item_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="1"
                          className="w-16 h-8 text-center text-sm"
                          value={ing.is_bottle ? (ing.quantity_ml || '') : (ing.quantity_units || '')}
                          onChange={e => handleUpdateQuantity(ing.item_id, e.target.value, ing.is_bottle)}
                        />
                        <Badge variant="outline" className="text-xs shrink-0">
                          {ing.is_bottle ? 'ml' : 'un'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveIngredient(ing.item_id)}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={ingredients.length === 0}>
            <Check className="h-4 w-4 mr-2" />
            Confirmar ({ingredients.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
