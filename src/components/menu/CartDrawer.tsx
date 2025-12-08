import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCart, DeliveryType } from '@/contexts/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmOrder: () => Promise<void>;
  isSubmitting: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  onOpenChange,
  onConfirmOrder,
  isSubmitting
}) => {
  const { items, updateQuantity, removeItem, totalItems, totalPrice, notes, setNotes, clearCart, deliveryType, setDeliveryType } = useCart();

  const handleConfirm = async () => {
    await onConfirmOrder();
  };

  const canConfirm = items.length > 0 && deliveryType !== null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Seu Pedido ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto flex-1">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground">Adicione itens do cardápio</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.cartId} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.price}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-background rounded-full px-2 py-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full"
                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-bold w-5 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-full"
                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeItem(item.cartId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Delivery Option */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-foreground mb-3">
                  Como deseja receber? <span className="text-destructive">*</span>
                </p>
                <RadioGroup 
                  value={deliveryType || ''} 
                  onValueChange={(value) => setDeliveryType(value as DeliveryType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mesa" id="delivery-mesa" />
                    <Label htmlFor="delivery-mesa" className="cursor-pointer">
                      Receber na mesa
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="balcao" id="delivery-balcao" />
                    <Label htmlFor="delivery-balcao" className="cursor-pointer">
                      Retirar no balcão
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="pt-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Observações (opcional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Sem cebola, bem passado..."
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">Total estimado:</span>
            <span className="text-2xl font-bold text-primary">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <Button 
            className="w-full" 
            size="lg"
            disabled={!canConfirm || isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Confirmar Pedido'
            )}
          </Button>
          {!deliveryType && items.length > 0 && (
            <p className="text-xs text-center text-destructive">
              Selecione como deseja receber seu pedido
            </p>
          )}
          {items.length > 0 && (
            <Button variant="ghost" onClick={clearCart} disabled={isSubmitting}>
              Limpar carrinho
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};