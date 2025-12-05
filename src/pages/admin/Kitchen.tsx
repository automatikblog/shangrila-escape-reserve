import React from 'react';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { KitchenOrderCard } from '@/components/admin/KitchenOrderCard';
import { Loader2, ChefHat } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

const Kitchen: React.FC = () => {
  const { orders, isLoading, updateOrderStatus } = useRealtimeOrders(['pending', 'preparing', 'ready']);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ChefHat className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cozinha</h1>
          <p className="text-muted-foreground">Pedidos em tempo real</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">Nenhum pedido no momento</p>
          <p className="text-muted-foreground text-sm">Os pedidos aparecerão aqui automaticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pendentes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-yellow-500">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
              <h2 className="font-bold text-lg">Pendentes ({pendingOrders.length})</h2>
            </div>
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
              {pendingOrders.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum pedido pendente
                </p>
              )}
            </div>
          </div>

          {/* Preparando */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-blue-500">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h2 className="font-bold text-lg">Preparando ({preparingOrders.length})</h2>
            </div>
            <div className="space-y-4">
              {preparingOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
              {preparingOrders.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum pedido em preparo
                </p>
              )}
            </div>
          </div>

          {/* Prontos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-green-500">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <h2 className="font-bold text-lg">Prontos ({readyOrders.length})</h2>
            </div>
            <div className="space-y-4">
              {readyOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
              {readyOrders.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum pedido pronto
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kitchen;
