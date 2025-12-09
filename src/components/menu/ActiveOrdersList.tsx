import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, ChefHat, CheckCircle, MapPin, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderItem {
  item_name: string;
  quantity: number;
}

interface Order {
  id: string;
  status: OrderStatus;
  delivery_type: string;
  created_at: string;
  notes: string | null;
  items?: OrderItem[];
}

interface ActiveOrdersListProps {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
}

const statusConfig: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { 
    label: 'Aguardando', 
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  preparing: { 
    label: 'Preparando', 
    icon: <ChefHat className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  ready: { 
    label: 'Pronto', 
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  delivered: { 
    label: 'Entregue', 
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
};

export const ActiveOrdersList: React.FC<ActiveOrdersListProps> = ({ orders, onSelectOrder }) => {
  if (orders.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Nenhum pedido ativo no momento.
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-3 p-4">
        {orders.map((order) => {
          const config = statusConfig[order.status];
          const itemsSummary = order.items
            ?.map(i => `${i.quantity}x ${i.item_name}`)
            .join(', ') || 'Sem itens';
          const timeAgo = formatDistanceToNow(new Date(order.created_at), { 
            addSuffix: false, 
            locale: ptBR 
          });

          return (
            <Card 
              key={order.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelectOrder(order.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={`${config.color} flex items-center gap-1`}>
                    {config.icon}
                    {config.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {order.delivery_type === 'balcao' ? (
                      <>
                        <Store className="h-3 w-3" />
                        <span>Balcão</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3 w-3" />
                        <span>Mesa</span>
                      </>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-foreground line-clamp-2 mb-2">
                  {itemsSummary}
                </p>
                
                <p className="text-xs text-muted-foreground">
                  há {timeAgo}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};
