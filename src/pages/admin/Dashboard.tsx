import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useAdminTables } from '@/hooks/useAdminTables';
import { Table2, ClipboardList, Clock, CheckCircle, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const { orders } = useRealtimeOrders();
  const { tables } = useAdminTables();
  const [todayReservations, setTodayReservations] = useState(0);

  useEffect(() => {
    const fetchTodayReservations = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('reservation_date', today)
        .eq('status', 'confirmed');
      setTodayReservations(count || 0);
    };
    fetchTodayReservations();
  }, []);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;

  const stats = [
    { 
      title: 'Mesas Ativas', 
      value: tables.filter(t => t.is_active).length, 
      icon: Table2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      title: 'Reservas Hoje', 
      value: todayReservations, 
      icon: CalendarDays,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    { 
      title: 'Pedidos Hoje', 
      value: todayOrders, 
      icon: ClipboardList,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      title: 'Pendentes', 
      value: pendingOrders, 
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema de pedidos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.slice(0, 5).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum pedido ainda
              </p>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        Mesa {order.table?.number} - {order.client?.client_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.items?.length || 0} item(s)
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                      order.status === 'preparing' ? 'bg-blue-500/20 text-blue-600' :
                      order.status === 'ready' ? 'bg-green-500/20 text-green-600' :
                      'bg-gray-500/20 text-gray-600'
                    }`}>
                      {order.status === 'pending' ? 'Pendente' :
                       order.status === 'preparing' ? 'Preparando' :
                       order.status === 'ready' ? 'Pronto' : 'Entregue'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mesas</CardTitle>
          </CardHeader>
          <CardContent>
            {tables.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma mesa cadastrada
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {tables.map((table) => (
                  <div 
                    key={table.id}
                    className={`p-3 rounded-lg text-center ${
                      table.is_active 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : 'bg-muted'
                    }`}
                  >
                    <p className="font-bold text-lg">{table.number}</p>
                    <p className="text-xs text-muted-foreground truncate">{table.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
