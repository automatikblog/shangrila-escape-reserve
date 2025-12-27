import React, { useState, useEffect } from 'react';
import { useHistoricalComandas, HistoricalComanda } from '@/hooks/useHistoricalComandas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Search, ChevronDown, ChevronUp, User, MapPin, Clock, Store, Loader2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ComandaHistoryView: React.FC = () => {
  const { comandas, isLoading, fetchComandas, reactivateComanda } = useHistoricalComandas();
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [expandedComandas, setExpandedComandas] = useState<Set<string>>(new Set());
  const [reactivateDialog, setReactivateDialog] = useState<{ open: boolean; sessionId: string; clientName: string }>({
    open: false,
    sessionId: '',
    clientName: '',
  });

  // Load today's data on mount
  useEffect(() => {
    handleQuickFilter('today');
  }, []);

  const parseLocalDateInput = (value: string) => {
    // HTML date input returns YYYY-MM-DD; new Date(value) treats it as UTC and shifts the day.
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
  };

  const handleSearch = () => {
    fetchComandas({
      dateFrom: dateFrom ? parseLocalDateInput(dateFrom) : undefined,
      dateTo: dateTo ? parseLocalDateInput(dateTo) : undefined,
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

    setDateFrom(format(from, 'yyyy-MM-dd'));
    setDateTo(format(today, 'yyyy-MM-dd'));
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

  const getPaymentStatus = (comanda: HistoricalComanda) => {
    if (comanda.remaining_total === 0 && comanda.total > 0) {
      return { label: 'Paga', variant: 'default' as const, className: 'bg-green-600' };
    }
    if (comanda.paid_total > 0 || comanda.partial_payments_total > 0) {
      return { label: 'Parcial', variant: 'secondary' as const, className: 'bg-yellow-600' };
    }
    return { label: 'Pendente', variant: 'destructive' as const, className: '' };
  };

  const handleReactivate = async () => {
    if (reactivateDialog.sessionId) {
      await reactivateComanda(reactivateDialog.sessionId, reactivateDialog.clientName);
    }
    setReactivateDialog({ open: false, sessionId: '', clientName: '' });
  };

  const totalRevenue = comandas.reduce((sum, c) => sum + c.total, 0);
  // Use the higher value between paid orders and partial payments for each comanda
  const totalReceived = comandas.reduce((sum, c) => sum + Math.max(c.paid_total, c.partial_payments_total), 0);
  const totalDiscount = comandas.reduce((sum, c) => sum + (c.discount || 0), 0);
  const totalPending = comandas.reduce((sum, c) => sum + c.remaining_total, 0);

  return (
    <div className="space-y-4">
      {/* Reactivate confirmation dialog */}
      <AlertDialog open={reactivateDialog.open} onOpenChange={(open) => !open && setReactivateDialog({ open: false, sessionId: '', clientName: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir comanda?</AlertDialogTitle>
            <AlertDialogDescription>
              A comanda de <strong>{reactivateDialog.clientName}</strong> será reativada e voltará para a lista de comandas ativas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReactivate}>Reabrir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              R$ {totalReceived.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Recebido</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">
              R$ {totalPending.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Pendente</div>
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
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-3 sm:px-6">
                        <div className="flex items-start justify-between gap-2">
                          {/* Left side - Client info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-semibold truncate">{comanda.client_name}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
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
                          
                          {/* Right side - Price, status and reopen button */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="font-bold text-sm sm:text-base">R$ {comanda.total.toFixed(2)}</div>
                              <Badge className={`${paymentStatus.className} text-xs`}>
                                {paymentStatus.label}
                              </Badge>
                            </div>
                            {!comanda.is_active && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReactivateDialog({
                                    open: true,
                                    sessionId: comanda.session_id,
                                    clientName: comanda.client_name,
                                  });
                                }}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Reabrir</span>
                              </Button>
                            )}
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
                      <CardContent className="pt-0 space-y-4 px-3 sm:px-6">
                        {/* Payment summary */}
                        <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm bg-muted/50 rounded-lg p-2 sm:p-3">
                          <div className="text-center sm:text-left">
                            <div className="text-muted-foreground">Total</div>
                            <div className="font-semibold">R$ {comanda.total.toFixed(2)}</div>
                          </div>
                          <div className="text-center sm:text-left">
                            <div className="text-muted-foreground">Pago</div>
                            <div className="font-semibold text-green-600">
                              R$ {(comanda.paid_total + comanda.partial_payments_total).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-center sm:text-left">
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
                              className="border rounded-lg p-2 sm:p-3 space-y-2"
                            >
                              {/* Order header - stacked on mobile */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                  <span className="font-medium">Pedido #{idx + 1}</span>
                                  <span className="text-muted-foreground">
                                    {formatTime(order.created_at)}
                                  </span>
                                  {order.delivery_type === 'mesa' ? (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                      <MapPin className="h-3 w-3 mr-0.5" />
                                      Mesa
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                      <Store className="h-3 w-3 mr-0.5" />
                                      Balcão
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-2">
                                  <span className="font-semibold text-sm">
                                    R$ {order.order_total.toFixed(2)}
                                  </span>
                                  {order.is_paid ? (
                                    <Badge className="bg-green-600 text-xs px-1.5 py-0">Pago</Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs px-1.5 py-0">Pendente</Badge>
                                  )}
                                </div>
                              </div>

                              {/* Items */}
                              <div className="space-y-1">
                                {order.items.map((item, itemIdx) => (
                                  <div
                                    key={itemIdx}
                                    className="flex justify-between text-xs sm:text-sm text-muted-foreground gap-2"
                                  >
                                    <span className="truncate">
                                      {item.quantity}x {item.item_name}
                                    </span>
                                    <span className="shrink-0">R$ {(item.item_price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Notes */}
                              {order.notes && (
                                <div className="text-xs sm:text-sm bg-muted/50 p-2 rounded">
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
                                className="flex justify-between items-start gap-2 text-xs sm:text-sm bg-green-50 dark:bg-green-950 p-2 rounded"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-muted-foreground">
                                    {formatTime(payment.created_at)}
                                  </span>
                                  {payment.notes && (
                                    <span className="ml-2 truncate">{payment.notes}</span>
                                  )}
                                </div>
                                <span className="font-semibold text-green-600 shrink-0">
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
