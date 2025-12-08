import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useAdminTables } from '@/hooks/useAdminTables';
import { Table2, ClipboardList, Clock, CalendarDays, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface LowStockItem {
  id: string;
  name: string;
  stock_quantity: number;
  category: string;
}

const AdminDashboard: React.FC = () => {
  const { orders } = useRealtimeOrders();
  const { tables } = useAdminTables();
  const [todayReservations, setTodayReservations] = useState(0);
  const [todayPeopleCount, setTodayPeopleCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  useEffect(() => {
    const fetchTodayData = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch reservations count and people count
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('num_people')
        .eq('reservation_date', today)
        .eq('status', 'confirmed');
      
      if (reservationsData) {
        setTodayReservations(reservationsData.length);
        setTodayPeopleCount(reservationsData.reduce((sum, r) => sum + r.num_people, 0));
      }

      // Fetch low stock items (5 or less)
      const { data: lowStock } = await supabase
        .from('menu_items')
        .select('id, name, stock_quantity, category')
        .not('stock_quantity', 'is', null)
        .lte('stock_quantity', 5)
        .order('stock_quantity', { ascending: true });
      
      if (lowStock) {
        setLowStockItems(lowStock as LowStockItem[]);
      }
    };
    fetchTodayData();
  }, []);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  // Calculate today's sales total
  const todaySalesTotal = todayOrders.reduce((total, order) => {
    const orderTotal = order.items?.reduce((sum, item) => sum + (item.item_price * item.quantity), 0) || 0;
    return total + orderTotal;
  }, 0);

  const stats = [
    { 
      title: 'Pessoas Hoje', 
      value: todayPeopleCount, 
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    { 
      title: 'Reservas Hoje', 
      value: todayReservations, 
      icon: CalendarDays,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    { 
      title: 'Vendas Hoje', 
      value: `R$ ${todaySalesTotal.toFixed(2).replace('.', ',')}`, 
      icon: DollarSign,
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

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-yellow-600">Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <Badge variant={item.stock_quantity === 0 ? "destructive" : "secondary"}>
                    {item.stock_quantity === 0 ? 'Esgotado' : `${item.stock_quantity} un`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
