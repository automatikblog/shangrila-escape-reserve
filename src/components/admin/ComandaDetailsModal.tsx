import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Comanda, ComandaOrder } from '@/hooks/useComandas';
import { Clock, DollarSign, FileText, User, MapPin, Store, Check, X } from 'lucide-react';

interface ComandaDetailsModalProps {
  comanda: Comanda | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkPaid: (comanda: Comanda) => void;
  onMarkUnpaid: (comanda: Comanda) => void;
  onClose: (comanda: Comanda) => void;
  onMarkOrderPaid?: (orderId: string) => void;
  onMarkOrderUnpaid?: (orderId: string) => void;
}

export const ComandaDetailsModal: React.FC<ComandaDetailsModalProps> = ({
  comanda,
  open,
  onOpenChange,
  onMarkPaid,
  onMarkUnpaid,
  onClose,
  onMarkOrderPaid,
  onMarkOrderUnpaid,
}) => {
  if (!comanda) return null;

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

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const allOrdersPaid = comanda.orders.length > 0 && comanda.orders.every(o => o.is_paid);
  const hasUnpaidOrders = comanda.orders.some(o => !o.is_paid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Comanda - {comanda.client_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Aberta há {formatTimeElapsed(comanda.created_at)}
          </span>
          {comanda.table_number !== 0 && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Mesa {comanda.table_number}
            </span>
          )}
          {comanda.table_number === 0 && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Store className="h-4 w-4" />
              Balcão
            </span>
          )}
        </div>

        <Separator />

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4">
            {comanda.orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum pedido ainda
              </p>
            ) : (
              comanda.orders.map((order, index) => (
                <div key={order.id} className={`space-y-2 p-3 rounded-lg border ${order.is_paid ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-background'}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Pedido #{index + 1}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(order.created_at)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {order.delivery_type === 'mesa' ? (
                          <><MapPin className="h-3 w-3 mr-1" />Mesa</>
                        ) : (
                          <><Store className="h-3 w-3 mr-1" />Balcão</>
                        )}
                      </Badge>
                    </div>
                    
                    {/* Payment toggle per order */}
                    {order.is_paid ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-green-600 hover:text-red-600"
                        onClick={() => onMarkOrderUnpaid?.(order.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Pago
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => onMarkOrderPaid?.(order.id)}
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Marcar Pago
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.item_name}</span>
                        <span className="text-muted-foreground">
                          R$ {(item.item_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{order.notes}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <span className="text-sm font-medium">
                      Subtotal: R$ {order.order_total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          {comanda.paid_total > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" />
                Pago
              </span>
              <span className="text-green-600 font-medium">
                R$ {comanda.paid_total.toFixed(2)}
              </span>
            </div>
          )}
          {comanda.unpaid_total > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-destructive flex items-center gap-1">
                <X className="h-4 w-4" />
                A pagar
              </span>
              <span className="text-destructive font-medium">
                R$ {comanda.unpaid_total.toFixed(2)}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">Total</span>
            </div>
            <span className="text-lg font-bold">
              R$ {comanda.total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {hasUnpaidOrders ? (
              <Button
                variant="default"
                onClick={() => onMarkPaid(comanda)}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Pagar Tudo (R$ {comanda.unpaid_total.toFixed(2)})
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => onMarkUnpaid(comanda)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Desmarcar Todos
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Salvar e Fechar
            </Button>
            <Button
              variant="destructive"
              onClick={() => onClose(comanda)}
            >
              Encerrar Comanda
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
