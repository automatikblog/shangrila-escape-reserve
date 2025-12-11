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
  onConfirm: (item: MenuItem, quantity: number) => void;
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

  // Reset quantity when item changes
  React.useEffect(() => {
    if (item) {
      // Try to extract default quantity from item name (e.g., "8 unidades")
      const match = item.name.match(/(\d+)\s*unidades?/i);
      if (match) {
        setQuantity(parseInt(match[1], 10));
      } else {
        setQuantity(defaultQuantity);
      }
    }
  }, [item, defaultQuantity]);

  if (!item) return null;

  const handleConfirm = () => {
    onConfirm(item, quantity);
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

        <div className="py-6 space-y-4">
          <div className="text-center">
            <Label className="text-sm text-muted-foreground">
              Quantidade de latas/unidades no balde
            </Label>
          </div>
          
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
          
          <p className="text-center text-sm text-muted-foreground">
            Preço: R$ {item.price.toFixed(2).replace('.', ',')}
          </p>
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