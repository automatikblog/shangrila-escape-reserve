import React, { useState, useEffect } from 'react';
import { useHistoricalComandas } from '@/hooks/useHistoricalComandas';
import { Comanda } from '@/hooks/useComandas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Search, ChevronDown, ChevronUp, User, MapPin, Clock, DollarSign, Store, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ComandaHistoryView: React.FC = () => {
  const { comandas, isLoading, fetchComandas } = useHistoricalComandas();
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [expandedComandas, setExpandedComandas] = useState<Set<string>>(new Set());

  // Load today's data on mount
  useEffect(() => {
    const today = new Date();
    handleQuickFilter('today');
  }, []);

  const handleSearch = () => {
    fetchComandas({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      clientName: clientName || undefined,
    });
  };

  const handleQuickFilter = (filter: 'today' | '7days' | '30days') => {
    const today = new Date();
    let from = new Date();
    
    switch (filter) {
      case 'today':
        from = new Date(today);
        break;
      case '7days':
        from = new Date(today);
        from.setDate(from.getDate() - 7);
        break;
      case '30days':
        from = new Date(today);
        from.setDate(from.getDate() - 30);
        break;
    }

    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
    setClientName('');

    fetchComandas({
      dateFrom: from,
      dateTo: today,
    });
  };

  const toggleExpanded = (sessionId: string) => {
    const newExpanded = new Set(expandedComandas);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedComandas(newExpanded);
  };

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), "HH:mm", { locale: ptBR });
  };

  const getPaymentStatus = (comanda: Comanda) => {
    if (comanda.remaining_total === 0 && comanda.total > 0) {
      return { label: 'Paga', variant: 'default' as const, className: 'bg-green-600' };
    }
    if (comanda.paid_total > 0 || comanda.partial_payments_total > 0) {
      return { label: 'Parcial', variant: 'secondary' as const, className: 'bg-yellow-600' };
    }
    return { label: 'Pendente', variant: 'destructive' as const, className: '' };
  };

  const totalRevenue = comandas.reduce((sum, c) => sum + c.total, 0);
  const totalPaid = comandas.reduce((sum, c) => sum + c.paid_total + c.partial_payments_total, 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter('today')}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter('7days')}
            >
              Últimos 7 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter('30days')}
            >
              Últimos 30 dias
            </Button>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dateFrom" className="text-sm">Data Inicial</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateTo" className="text-sm">Data Final</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientName" className="text-sm">Nome do Cliente</Label>
              <Input
                id="clientName"
                placeholder="Buscar por nome..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{comandas.length}</div>
            <div className="text-sm text-muted-foreground">Comandas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              R$ {totalRevenue.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Faturado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              R$ {totalPaid.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Recebido</div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : comandas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma comanda encontrada para os filtros selecionados.
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-450px)]">
          <div className="space-y-3 pr-4">
            {comandas.map((comanda) => {
              const isExpanded = expandedComandas.has(comanda.session_id);
              const paymentStatus = getPaymentStatus(comanda);

              return (
                <Collapsible
                  key={comanda.session_id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(comanda.session_id)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{comanda.client_name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                {comanda.table_number === 0 ? (
                                  <span className="flex items-center gap-1">
                                    <Store className="h-3 w-3" />
                                    Balcão
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    Mesa {comanda.table_number}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(comanda.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(comanda.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-bold">R$ {comanda.total.toFixed(2)}</div>
                              <Badge className={paymentStatus.className}>
                                {paymentStatus.label}
                              </Badge>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {/* Payment summary */}
                        <div className="grid grid-cols-3 gap-2 text-sm bg-muted/50 rounded-lg p-3">
                          <div>
                            <div className="text-muted-foreground">Total</div>
                            <div className="font-semibold">R$ {comanda.total.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Pago</div>
                            <div className="font-semibold text-green-600">
                              R$ {(comanda.paid_total + comanda.partial_payments_total).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Restante</div>
                            <div className="font-semibold text-orange-600">
                              R$ {comanda.remaining_total.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Orders */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Pedidos ({comanda.orders.length})</h4>
                          {comanda.orders.map((order, idx) => (
                            <div
                              key={order.id}
                              className="border rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">Pedido #{idx + 1}</span>
                                  <span className="text-muted-foreground">
                                    {formatTime(order.created_at)}
                                  </span>
                                  {order.delivery_type === 'mesa' ? (
                                    <Badge variant="outline" className="text-xs">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      Mesa
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      <Store className="h-3 w-3 mr-1" />
                                      Balcão
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    R$ {order.order_total.toFixed(2)}
                                  </span>
                                  {order.is_paid ? (
                                    <Badge className="bg-green-600 text-xs">Pago</Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">Pendente</Badge>
                                  )}
                                </div>
                              </div>

                              {/* Items */}
                              <div className="space-y-1">
                                {order.items.map((item, itemIdx) => (
                                  <div
                                    key={itemIdx}
                                    className="flex justify-between text-sm text-muted-foreground"
                                  >
                                    <span>
                                      {item.quantity}x {item.item_name}
                                    </span>
                                    <span>R$ {(item.item_price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Notes */}
                              {order.notes && (
                                <div className="text-sm bg-muted/50 p-2 rounded">
                                  <span className="text-muted-foreground">Obs: </span>
                                  {order.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Partial payments */}
                        {comanda.partial_payments.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Pagamentos Parciais</h4>
                            {comanda.partial_payments.map((payment) => (
                              <div
                                key={payment.id}
                                className="flex justify-between text-sm bg-green-50 dark:bg-green-950 p-2 rounded"
                              >
                                <div>
                                  <span className="text-muted-foreground">
                                    {formatTime(payment.created_at)}
                                  </span>
                                  {payment.notes && (
                                    <span className="ml-2">{payment.notes}</span>
                                  )}
                                </div>
                                <span className="font-semibold text-green-600">
                                  R$ {Number(payment.amount).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
