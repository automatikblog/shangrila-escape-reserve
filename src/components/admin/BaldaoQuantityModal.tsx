import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Beer } from 'lucide-react';
import { MenuItem } from '@/hooks/useMenuItems';

interface BaldaoQuantityModalProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (item: MenuItem, quantity: number, customPrice: number) => void;
  defaultQuantity?: number;
}

export const BaldaoQuantityModal: React.FC<BaldaoQuantityModalProps> = ({
  item,
  open,
  onOpenChange,
  onConfirm,
  defaultQuantity = 8,
}) => {
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [customPrice, setCustomPrice] = useState(0);

  // Reset quantity and price when item changes
  React.useEffect(() => {
    if (item) {
      // Try to extract default quantity from item name (e.g., "8 unidades")
      const match = item.name.match(/(\d+)\s*unidades?/i);
      if (match) {
        setQuantity(parseInt(match[1], 10));
      } else {
        setQuantity(defaultQuantity);
      }
      setCustomPrice(item.price);
    }
  }, [item, defaultQuantity]);

  if (!item) return null;

  // Calculate price per unit
  const pricePerUnit = quantity > 0 ? customPrice / quantity : 0;

  const handleConfirm = () => {
    onConfirm(item, quantity, customPrice);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beer className="h-5 w-5" />
            {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Quantity selector */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground text-center block">
              Quantidade de latas/unidades no balde
            </Label>
            <div className="flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-12 w-12"
              >
                <Minus className="h-5 w-5" />
              </Button>
              
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 h-12 text-center text-2xl font-bold"
              />
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-12 w-12"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Price editor */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground text-center block">
              Preço total do baldão
            </Label>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-medium">R$</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-28 h-12 text-center text-xl font-bold"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              ≈ R$ {pricePerUnit.toFixed(2).replace('.', ',')} por unidade
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Adicionar ao Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
