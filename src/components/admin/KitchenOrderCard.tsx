import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, ChefHat, MapPin, Store } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderItem {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  category: string;
  goes_to_kitchen?: boolean;
}

interface KitchenOrderCardProps {
  order: {
    id: string;
    status: OrderStatus;
    notes: string | null;
    delivery_type?: string;
    created_at: string;
    items?: OrderItem[];
    table?: { number: number; name: string };
    client?: { client_name: string };
  };
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
  preparing: { label: 'Preparando', color: 'bg-blue-500', icon: ChefHat },
  ready: { label: 'Pronto', color: 'bg-green-500', icon: CheckCircle },
  delivered: { label: 'Entregue', color: 'bg-gray-500', icon: CheckCircle },
};

export const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({
  order,
  onUpdateStatus
}) => {
  const config = statusConfig[order.status];
  const StatusIcon = config.icon;

  const timeAgo = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  // Calculate order total
  const orderTotal = order.items?.reduce((sum, item) => sum + (item.item_price * item.quantity), 0) || 0;

  const deliveryLabel = order.delivery_type === 'balcao' ? 'Retirar no balcão' : 'Entregar na mesa';
  const DeliveryIcon = order.delivery_type === 'balcao' ? Store : MapPin;

  return (
    <Card className={`transition-all ${order.status === 'pending' ? 'border-yellow-500 border-2 animate-pulse' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              Mesa {order.table?.number} - {order.table?.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {order.client?.client_name} • {timeAgo}
            </p>
            <Badge 
              variant="outline" 
              className={`mt-2 ${order.delivery_type === 'balcao' ? 'border-purple-500 text-purple-700 bg-purple-50' : 'border-emerald-500 text-emerald-700 bg-emerald-50'}`}
            >
              <DeliveryIcon className="h-3 w-3 mr-1" />
              {deliveryLabel}
            </Badge>
          </div>
          <Badge className={`${config.color} text-white`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          {order.items?.filter(item => item.goes_to_kitchen !== false).map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <span className="font-medium">
                {item.quantity}x {item.item_name}
              </span>
              <span className="text-sm text-muted-foreground">
                R$ {(item.item_price * item.quantity).toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center py-2 border-t border-b mb-4">
          <span className="font-semibold">Total do Pedido:</span>
          <span className="font-bold text-lg text-primary">
            R$ {orderTotal.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {order.notes && (
          <div className="bg-muted p-2 rounded text-sm mb-4">
            <strong>Obs:</strong> {order.notes}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {order.status === 'pending' && (
            <Button
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => onUpdateStatus(order.id, 'preparing')}
            >
              <ChefHat className="h-4 w-4 mr-1" />
              Preparar
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600"
              onClick={() => onUpdateStatus(order.id, 'ready')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Pronto
            </Button>
          )}
          {order.status === 'ready' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(order.id, 'delivered')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Entregue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
