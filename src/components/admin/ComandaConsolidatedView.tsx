import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Comanda } from '@/hooks/useComandas';
import { ShoppingBag, User, MapPin, Store, Clock, DollarSign, Users, Baby } from 'lucide-react';

interface ConsolidatedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ComandaConsolidatedViewProps {
  comanda: Comanda | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ComandaConsolidatedView: React.FC<ComandaConsolidatedViewProps> = ({
  comanda,
  open,
  onOpenChange,
}) => {
  if (!comanda) return null;

  // Consolidate all items from all orders
  const itemMap = new Map<string, ConsolidatedItem>();

  comanda.orders.forEach(order => {
    order.items.forEach(item => {
      const key = `${item.item_name}-${item.item_price}`;
      if (itemMap.has(key)) {
        const existing = itemMap.get(key)!;
        existing.quantity += item.quantity;
        existing.total += item.item_price * item.quantity;
      } else {
        itemMap.set(key, {
          name: item.item_name,
          quantity: item.quantity,
          unitPrice: item.item_price,
          total: item.item_price * item.quantity,
        });
      }
    });
  });

  // Convert map to array and sort by name
  const consolidatedItems: ConsolidatedItem[] = [];
  itemMap.forEach(item => consolidatedItems.push(item));
  consolidatedItems.sort((a, b) => a.name.localeCompare(b.name));

  const formatTimeElapsed = (dateStr: string) => {
    const start = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const companions = comanda.companions || [];
  const totalPeople = 1 + companions.length;
  const childrenCount = companions.filter(c => c.isChild).length;
  const adultsCount = totalPeople - childrenCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 p-6 pb-4 text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <ShoppingBag className="h-5 w-5" />
            Resumo do Consumo
          </DialogTitle>
        </DialogHeader>

        {/* Customer Info */}
        <div className="shrink-0 px-6 pb-4 space-y-2">
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {comanda.client_name}
            </span>
            {comanda.table_number !== 0 ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Mesa {comanda.table_number}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Store className="h-4 w-4" />
                Balcão
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTimeElapsed(comanda.created_at)}
            </span>
          </div>
          
          {companions.length > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{adultsCount} adulto{adultsCount !== 1 ? 's' : ''}</span>
              {childrenCount > 0 && (
                <span className="flex items-center gap-1">
                  <Baby className="h-3 w-3" />
                  {childrenCount} criança{childrenCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <Separator className="shrink-0" />

        {/* Items List */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4">
            {consolidatedItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum item consumido
              </p>
            ) : (
              <div className="space-y-1">
                {consolidatedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-muted last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary/10 text-primary font-semibold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                        {item.quantity}
                      </span>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      R$ {item.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator className="shrink-0" />

        {/* Totals */}
        <div className="shrink-0 px-6 py-4 space-y-2 bg-muted/30">
          {comanda.discount && comanda.discount > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Desconto</span>
              <span>- R$ {comanda.discount.toFixed(2)}</span>
            </div>
          )}
          {comanda.partial_payments_total > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Pagamentos</span>
              <span>- R$ {comanda.partial_payments_total.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">Total</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              R$ {comanda.remaining_total.toFixed(2)}
            </span>
          </div>
          {comanda.remaining_total <= 0 && (
            <p className="text-center text-green-600 font-medium">
              ✓ Pago
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
