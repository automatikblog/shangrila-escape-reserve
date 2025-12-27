import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useTablesWithActivity, getTableStatus, TableStatus } from '@/hooks/useTablesWithActivity';
import { useStaleProducts } from '@/hooks/useStaleProducts';
import { useSettings } from '@/hooks/useSettings';
import { useComandas } from '@/hooks/useComandas';
import { Table2, ClipboardList, Clock, CalendarDays, Users, DollarSign, AlertTriangle, PackageX, Settings, User, X, Receipt, Check, Coffee, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
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
  const { comandas, markAsPaid, markAsUnpaid, closeComanda, markOrderPaid, markOrderUnpaid, remainingTotal, refetch: refetchComandas } = useComandas();
  const [todayReservations, setTodayReservations] = useState(0);
  const [todayPeopleCount, setTodayPeopleCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempInactivity, setTempInactivity] = useState(settings.table_inactivity_minutes);
  const [tempStaleDays, setTempStaleDays] = useState(settings.no_sales_alert_days);
  const [comandaFilter, setComandaFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [expandedComanda, setExpandedComanda] = useState<string | null>(null);
  
  // Revenue report state
  const [revenueStartDate, setRevenueStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [revenueEndDate, setRevenueEndDate] = useState<Date | undefined>(new Date());
  const [periodRevenue, setPeriodRevenue] = useState<number | null>(null);
  const [periodClientCount, setPeriodClientCount] = useState<number>(0);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

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

  // Fetch revenue for selected period
  const fetchPeriodRevenue = async () => {
    if (!revenueStartDate || !revenueEndDate) return;
    
    setLoadingRevenue(true);
    try {
      const startISO = startOfDay(revenueStartDate).toISOString();
      const endISO = endOfDay(revenueEndDate).toISOString();
      
      // Fetch client sessions (unique clients) in period
      const { data: sessions, error: sessionsError } = await supabase
        .from('client_sessions')
        .select('id')
        .gte('created_at', startISO)
        .lte('created_at', endISO);
      
      if (sessionsError) throw sessionsError;
      
      if (!sessions || sessions.length === 0) {
        setPeriodRevenue(0);
        setPeriodClientCount(0);
        return;
      }
      
      const sessionIds = sessions.map(s => s.id);
      
      // Fetch orders for these sessions
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .in('client_session_id', sessionIds);
      
      if (ordersError) throw ordersError;
      
      if (!orders || orders.length === 0) {
        setPeriodRevenue(0);
        setPeriodClientCount(sessions.length);
        return;
      }
      
      // Fetch order items for these orders
      const orderIds = orders.map(o => o.id);
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('item_price, quantity')
        .in('order_id', orderIds);
      
      if (itemsError) throw itemsError;
      
      const total = (items || []).reduce((sum, item) => 
        sum + (item.item_price * item.quantity), 0
      );
      
      setPeriodRevenue(total);
      setPeriodClientCount(sessions.length);
    } catch (err) {
      console.error('Error fetching revenue:', err);
      toast.error('Erro ao buscar faturamento');
    } finally {
      setLoadingRevenue(false);
    }
  };

  useEffect(() => {
    fetchPeriodRevenue();
  }, [revenueStartDate, revenueEndDate]);

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

  const handleMarkPaid = async (sessionId: string) => {
    const comanda = comandas.find(c => c.session_id === sessionId);
    if (!comanda) return;
    
    // Mark all unpaid orders as paid
    for (const order of comanda.orders.filter(o => !o.is_paid)) {
      await markOrderPaid(order.id);
    }
    toast.success('Todos os pedidos marcados como pagos!');
    refetchTables();
  };

  const handleMarkUnpaid = async (sessionId: string) => {
    const comanda = comandas.find(c => c.session_id === sessionId);
    if (!comanda) return;
    
    // Mark all paid orders as unpaid
    for (const order of comanda.orders.filter(o => o.is_paid)) {
      await markOrderUnpaid(order.id);
    }
    toast.success('Pagamentos desmarcados');
    refetchTables();
  };

  const handleCloseComanda = async (sessionId: string, tableNumber: number) => {
    const success = await closeComanda(sessionId);
    if (success) {
      toast.success(tableNumber === 0 ? 'Comanda fechada!' : `Mesa ${tableNumber} fechada!`);
      refetchTables();
    } else {
      toast.error('Erro ao fechar comanda');
    }
  };

  const filteredComandas = comandas.filter(c => {
    if (comandaFilter === 'unpaid') return c.remaining_total > 0;
    if (comandaFilter === 'paid') return c.remaining_total === 0;
    return true;
  });

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
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

  // Calculate paid vs unpaid for today
  const todayPaidTotal = todayOrders
    .filter(o => o.is_paid)
    .reduce((total, order) => {
      const orderTotal = order.items?.reduce((sum, item) => sum + (item.item_price * item.quantity), 0) || 0;
      return total + orderTotal;
    }, 0);

  const todayUnpaidTotal = todaySalesTotal - todayPaidTotal;

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
      title: 'Recebido Hoje', 
      value: `R$ ${todayPaidTotal.toFixed(2).replace('.', ',')}`, 
      icon: Check,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      subtitle: todayUnpaidTotal > 0 ? `+ R$ ${todayUnpaidTotal.toFixed(2).replace('.', ',')} em aberto` : undefined
    },
    { 
      title: 'Pedidos na Cozinha', 
      value: pendingOrders, 
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      subtitle: 'aguardando preparo'
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

      {/* Revenue Report Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="flex flex-row items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Relatório de Faturamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !revenueStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {revenueStartDate ? format(revenueStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={revenueStartDate}
                    onSelect={setRevenueStartDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !revenueEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {revenueEndDate ? format(revenueEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={revenueEndDate}
                    onSelect={setRevenueEndDate}
                    disabled={(date) => date > new Date() || (revenueStartDate && date < revenueStartDate)}
                    initialFocus
                    className="pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setRevenueStartDate(new Date());
                  setRevenueEndDate(new Date());
                }}
              >
                Hoje
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const yesterday = subDays(new Date(), 1);
                  setRevenueStartDate(yesterday);
                  setRevenueEndDate(yesterday);
                }}
              >
                Ontem
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setRevenueStartDate(subDays(new Date(), 7));
                  setRevenueEndDate(new Date());
                }}
              >
                7 dias
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setRevenueStartDate(subDays(new Date(), 30));
                  setRevenueEndDate(new Date());
                }}
              >
                30 dias
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-background p-3 sm:p-4 rounded-lg border col-span-2 sm:col-span-1">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Faturamento Total</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {loadingRevenue ? (
                  <span className="text-muted-foreground">Carregando...</span>
                ) : periodRevenue !== null ? (
                  `R$ ${periodRevenue.toFixed(2).replace('.', ',')}`
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div className="bg-background p-3 sm:p-4 rounded-lg border">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Clientes</p>
              <p className="text-2xl sm:text-3xl font-bold">
                {loadingRevenue ? '-' : periodClientCount}
              </p>
            </div>
            {periodClientCount > 0 && periodRevenue !== null && (
              <div className="bg-background p-3 sm:p-4 rounded-lg border">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Ticket Médio</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  R$ {(periodRevenue / periodClientCount).toFixed(2).replace('.', ',')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Comandas Section */}
      <Card>
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Receipt className="h-5 w-5 text-primary shrink-0" />
            <CardTitle className="text-base sm:text-lg">Comandas de Hoje</CardTitle>
            {remainingTotal > 0 && (
              <Badge variant="destructive" className="text-xs">
                A receber: R$ {remainingTotal.toFixed(2).replace('.', ',')}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <Button
              variant={comandaFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setComandaFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={comandaFilter === 'unpaid' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setComandaFilter('unpaid')}
            >
              Não Pagas
            </Button>
            <Button
              variant={comandaFilter === 'paid' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setComandaFilter('paid')}
            >
              Pagas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredComandas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {comandaFilter === 'unpaid' ? 'Nenhuma comanda pendente' : 'Nenhuma comanda encontrada'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredComandas.map((comanda) => (
                <div 
                  key={comanda.session_id}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    comanda.remaining_total === 0 ? 'bg-green-500/5 border-green-500/30' : 'bg-background'
                  }`}
                >
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/30"
                    onClick={() => setExpandedComanda(
                      expandedComanda === comanda.session_id ? null : comanda.session_id
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        comanda.table_number === 0 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-muted'
                      }`}>
                        {comanda.table_number === 0 ? (
                          <Coffee className="h-5 w-5" />
                        ) : (
                          comanda.table_number
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{comanda.client_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {comanda.table_number === 0 ? 'Balcão' : `Mesa ${comanda.table_number}`}
                          {' • '}{formatTime(comanda.created_at)}
                          {comanda.items.length > 0 && ` • ${comanda.items.length} item(s)`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          R$ {comanda.total.toFixed(2).replace('.', ',')}
                        </p>
                        {comanda.remaining_total === 0 ? (
                          <Badge variant="outline" className="text-green-600 border-green-500/50">
                            <Check className="h-3 w-3 mr-1" /> Pago
                          </Badge>
                        ) : (comanda.paid_total > 0 || comanda.partial_payments_total > 0) ? (
                          <span className="text-xs text-muted-foreground">
                            Pago: R$ {(comanda.paid_total + comanda.partial_payments_total).toFixed(2)} | Falta: R$ {comanda.remaining_total.toFixed(2)}
                          </span>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            A pagar
                          </Badge>
                        )}
                      </div>
                      {expandedComanda === comanda.session_id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedComanda === comanda.session_id && (
                    <div className="border-t p-3 bg-muted/30 space-y-3">
                      {comanda.items.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Itens</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            {comanda.items.map((item, idx) => (
                              <div key={idx} className="text-sm flex justify-between">
                                <span>{item.quantity}x {item.item_name}</span>
                                <span className="text-muted-foreground">
                                  R$ {(item.item_price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {comanda.unpaid_total === 0 ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkUnpaid(comanda.session_id)}
                            >
                              Desmarcar Pagamento
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <X className="h-4 w-4 mr-1" />
                                  Fechar Comanda
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Fechar comanda de {comanda.client_name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Isso encerrará a sessão. {comanda.table_number !== 0 && 'A mesa ficará disponível para novos clientes.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCloseComanda(comanda.session_id, comanda.table_number)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Fechar Comanda
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleMarkPaid(comanda.session_id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Pagar Tudo (R$ {comanda.unpaid_total.toFixed(2)})
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
          <CardHeader className="space-y-2 pb-3">
            <CardTitle className="text-base sm:text-lg">Status das Mesas</CardTitle>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
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
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {tables.map((table) => {
                  const status = getTableStatus(table, settings.table_inactivity_minutes);
                  const config = statusConfig[status];
                  return (
                    <div 
                      key={table.id}
                      className={`p-2 sm:p-3 rounded-lg border ${config.bg} ${config.border} relative group min-w-0`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-base sm:text-lg">{table.number}</p>
                        {table.session_id && table.client_name ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-destructive" />
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
                          <p className="text-[10px] sm:text-xs font-medium truncate flex items-center gap-1" title={table.client_name}>
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{table.client_name}</span>
                          </p>
                          {table.minutes_since_order !== null && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {table.minutes_since_order} min
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate" title={table.name}>{table.name}</p>
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
