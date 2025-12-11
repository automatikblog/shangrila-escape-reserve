import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useTablesWithActivity, getTableStatus, TableStatus } from '@/hooks/useTablesWithActivity';
import { useStaleProducts } from '@/hooks/useStaleProducts';
import { useSettings } from '@/hooks/useSettings';
import { Table2, ClipboardList, Clock, CalendarDays, Users, DollarSign, AlertTriangle, PackageX, Settings, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface LowStockItem {
  id: string;
  name: string;
  stock_quantity: number;
  category: string;
}

const statusConfig: Record<TableStatus, { bg: string; border: string; label: string; dot: string }> = {
  active: { 
    bg: 'bg-green-500/20', 
    border: 'border-green-500/50', 
    label: 'Consumindo',
    dot: 'bg-green-500'
  },
  attention: { 
    bg: 'bg-yellow-500/20', 
    border: 'border-yellow-500/50', 
    label: 'Atenção',
    dot: 'bg-yellow-500'
  },
  free: { 
    bg: 'bg-muted', 
    border: 'border-border', 
    label: 'Livre',
    dot: 'bg-gray-400'
  },
  inactive: { 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/30', 
    label: 'Desativada',
    dot: 'bg-red-500'
  },
};

const AdminDashboard: React.FC = () => {
  const { orders } = useRealtimeOrders();
  const { tables, refetch: refetchTables } = useTablesWithActivity();
  const { settings, updateSetting } = useSettings();
  const { products: staleProducts } = useStaleProducts(settings.no_sales_alert_days);
  const [todayReservations, setTodayReservations] = useState(0);
  const [todayPeopleCount, setTodayPeopleCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempInactivity, setTempInactivity] = useState(settings.table_inactivity_minutes);
  const [tempStaleDays, setTempStaleDays] = useState(settings.no_sales_alert_days);

  useEffect(() => {
    setTempInactivity(settings.table_inactivity_minutes);
    setTempStaleDays(settings.no_sales_alert_days);
  }, [settings]);

  useEffect(() => {
    const fetchTodayData = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('num_people')
        .eq('reservation_date', today)
        .eq('status', 'confirmed');
      
      if (reservationsData) {
        setTodayReservations(reservationsData.length);
        setTodayPeopleCount(reservationsData.reduce((sum, r) => sum + r.num_people, 0));
      }

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

  const handleSaveSettings = async () => {
    const success1 = await updateSetting('table_inactivity_minutes', tempInactivity);
    const success2 = await updateSetting('no_sales_alert_days', tempStaleDays);
    
    if (success1 && success2) {
      toast.success('Configurações salvas!');
      setSettingsOpen(false);
    } else {
      toast.error('Erro ao salvar configurações');
    }
  };

  const closeTable = async (sessionId: string, tableNumber: number) => {
    try {
      const { error } = await supabase
        .from('client_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) {
        toast.error('Erro ao fechar mesa');
        console.error('Error closing table:', error);
        return;
      }

      toast.success(`Mesa ${tableNumber} fechada`);
      refetchTables();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao fechar mesa');
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const todaySalesTotal = todayOrders.reduce((total, order) => {
    const orderTotal = order.items?.reduce((sum, item) => sum + (item.item_price * item.quantity), 0) || 0;
    return total + orderTotal;
  }, 0);

  // Tables requiring attention
  const attentionTables = tables.filter(t => 
    getTableStatus(t, settings.table_inactivity_minutes) === 'attention'
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de pedidos</p>
        </div>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurações do Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="inactivity">Tempo de inatividade da mesa (minutos)</Label>
                <Input
                  id="inactivity"
                  type="number"
                  min={1}
                  value={tempInactivity}
                  onChange={(e) => setTempInactivity(parseInt(e.target.value) || 40)}
                />
                <p className="text-xs text-muted-foreground">
                  Mesas sem pedidos há mais de {tempInactivity} minutos ficam em alerta
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staleDays">Dias sem venda para alerta de produto</Label>
                <Input
                  id="staleDays"
                  type="number"
                  min={1}
                  value={tempStaleDays}
                  onChange={(e) => setTempStaleDays(parseInt(e.target.value) || 15)}
                />
                <p className="text-xs text-muted-foreground">
                  Produtos sem venda há mais de {tempStaleDays} dias aparecem no alerta
                </p>
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                Salvar Configurações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
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

      {/* Tables Needing Attention Alert */}
      {attentionTables.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="flex flex-row items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-yellow-600">
              Mesas sem Consumo ({attentionTables.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {attentionTables.map((table) => (
                <div 
                  key={table.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-yellow-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center font-bold">
                      {table.number}
                    </div>
                    <div>
                      <p className="font-medium">{table.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {table.minutes_since_order !== null 
                          ? `${table.minutes_since_order} min sem pedir`
                          : 'Sem pedidos ainda'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-orange-600">Estoque Baixo</CardTitle>
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

      {/* Stale Products Alert */}
      {staleProducts.length > 0 && (
        <Card className="border-purple-500/50 bg-purple-500/5">
          <CardHeader className="flex flex-row items-center gap-2">
            <PackageX className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-purple-600">
              Produtos Encalhados ({staleProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Produtos sem venda há mais de {settings.no_sales_alert_days} dias
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {staleProducts.slice(0, 9).map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                  <Badge variant="outline" className="text-purple-600 border-purple-500/50">
                    {product.days_since_sale >= 9999 
                      ? 'Nunca vendeu' 
                      : `${product.days_since_sale} dias`
                    }
                  </Badge>
                </div>
              ))}
            </div>
            {staleProducts.length > 9 && (
              <p className="text-sm text-muted-foreground mt-3 text-center">
                E mais {staleProducts.length - 9} produtos...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
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

        {/* Smart Tables Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Status das Mesas</CardTitle>
            <div className="flex gap-2 text-xs">
              {Object.entries(statusConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                  <span className="text-muted-foreground">{config.label}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {tables.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma mesa cadastrada
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {tables.map((table) => {
                  const status = getTableStatus(table, settings.table_inactivity_minutes);
                  const config = statusConfig[status];
                  return (
                    <div 
                      key={table.id}
                      className={`p-3 rounded-lg border ${config.bg} ${config.border} relative group`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-lg">{table.number}</p>
                        {table.session_id && table.client_name ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Fechar Mesa {table.number}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Isso encerrará a sessão de <strong>{table.client_name}</strong>.
                                  A mesa ficará disponível para novos clientes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => closeTable(table.session_id!, table.number)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Fechar Mesa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                        )}
                      </div>
                      {table.client_name ? (
                        <>
                          <p className="text-xs font-medium truncate flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {table.client_name}
                          </p>
                          {table.minutes_since_order !== null && (
                            <p className="text-xs text-muted-foreground">
                              {table.minutes_since_order} min
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground truncate">{table.name}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
