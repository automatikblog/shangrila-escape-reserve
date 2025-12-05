import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, CheckCircle, Package } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderStatusViewProps {
  order: {
    id: string;
    status: OrderStatus;
    notes: string | null;
    created_at: string;
    items?: { item_name: string; quantity: number }[];
  };
  onNewOrder: () => void;
}

const statusSteps = [
  { status: 'pending', label: 'Recebido', icon: Clock },
  { status: 'preparing', label: 'Preparando', icon: ChefHat },
  { status: 'ready', label: 'Pronto', icon: CheckCircle },
  { status: 'delivered', label: 'Entregue', icon: Package },
];

export const OrderStatusView: React.FC<OrderStatusViewProps> = ({ order, onNewOrder }) => {
  const currentStepIndex = statusSteps.findIndex(s => s.status === order.status);

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Acompanhe seu Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Status Steps */}
          <div className="flex justify-between items-center mb-8">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.status} className="flex flex-col items-center flex-1">
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all
                      ${isCurrent 
                        ? 'bg-primary text-primary-foreground scale-110 animate-pulse' 
                        : isActive 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`text-xs text-center ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                  
                  {/* Connector line */}
                  {index < statusSteps.length - 1 && (
                    <div 
                      className={`absolute h-0.5 w-full left-1/2 top-6 -z-10 ${
                        index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                      }`}
                      style={{ width: 'calc(100% - 3rem)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Order Details */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <h3 className="font-medium mb-2">Itens do Pedido:</h3>
            <div className="space-y-1">
              {order.items?.map((item, idx) => (
                <p key={idx} className="text-sm text-muted-foreground">
                  {item.quantity}x {item.item_name}
                </p>
              ))}
            </div>
            {order.notes && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm">
                  <span className="font-medium">Obs:</span> {order.notes}
                </p>
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            {order.status === 'pending' && (
              <p className="text-foreground">
                🕐 Seu pedido foi recebido e está aguardando confirmação da cozinha.
              </p>
            )}
            {order.status === 'preparing' && (
              <p className="text-foreground">
                👨‍🍳 Seu pedido está sendo preparado com carinho!
              </p>
            )}
            {order.status === 'ready' && (
              <p className="text-foreground font-medium text-green-600">
                ✅ Seu pedido está pronto! Aguarde a entrega na mesa.
              </p>
            )}
            {order.status === 'delivered' && (
              <p className="text-foreground">
                🎉 Pedido entregue! Bom apetite!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={onNewOrder}>
        Fazer Novo Pedido
      </Button>
    </div>
  );
};
