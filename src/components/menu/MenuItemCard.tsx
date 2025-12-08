import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus } from 'lucide-react';
import { MenuItem } from '@/lib/menuData';
import { useCart } from '@/contexts/CartContext';


interface MenuItemCardProps {
  item: MenuItem;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const { items, addItem, updateQuantity, canAddMore } = useCart();
  
  const cartItem = items.find(i => i.name === item.name && i.category === item.category);
  const quantity = cartItem?.quantity || 0;
  const hasLimitedStock = item.stockQuantity !== null && item.stockQuantity !== undefined;
  const remainingStock = hasLimitedStock ? (item.stockQuantity! - quantity) : null;
  const canAdd = canAddMore(item);

  const handleAdd = () => {
    addItem(item);
  };

  const handleRemove = () => {
    if (cartItem && quantity > 0) {
      updateQuantity(cartItem.cartId, quantity - 1);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground leading-tight text-sm">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            )}
            <p className="text-primary font-semibold text-sm mt-2">{item.price}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {quantity > 0 ? (
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-2 py-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full"
                  onClick={handleRemove}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold text-primary w-6 text-center">{quantity}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full"
                  onClick={handleAdd}
                  disabled={!canAdd}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={handleAdd}
                disabled={!canAdd}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};