import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMenuItems, categoryLabels } from '@/hooks/useMenuItems';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useComandas, Comanda } from '@/hooks/useComandas';
import { useFrequentItems } from '@/hooks/useFrequentItems';
import { ComandaDetailsModal } from '@/components/admin/ComandaDetailsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Minus, Trash2, ShoppingCart, User, MapPin, Store, Send, Search, Coffee, Clock, DollarSign, Check, X, Eye, Ticket, Waves, Flame, TrendingUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
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

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface Table {
  id: string;
  number: number;
  name: string;
}

const Atendimento: React.FC = () => {
  const { items: menuItems, isLoading: loadingMenu } = useMenuItems();
  const { createOrder } = useRealtimeOrders();
  const { items: frequentItems, isLoading: loadingFrequent } = useFrequentItems(6);
  const [tables, setTables] = useState<Table[]>([]);
  const [balcaoTable, setBalcaoTable] = useState<Table | null>(null);
  const [loadingTables, setLoadingTables] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isBalcaoMode, setIsBalcaoMode] = useState(false);
  const [clientName, setClientName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<'mesa' | 'balcao' | null>('balcao'); // Default to balcão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Comanda management
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [comandaToClose, setComandaToClose] = useState<Comanda | null>(null);
  const [detailsModalComanda, setDetailsModalComanda] = useState<Comanda | null>(null);
  
  // Fetch all active comandas (we'll filter locally)
  const { 
    comandas: allComandas, 
    isLoading: loadingComandas,
    refetch: refetchComandas,
    markAsPaid,
    markAsUnpaid,
    closeComanda,
    markOrderPaid,
    markOrderUnpaid,
    addPartialPayment,
  } = useComandas();

  // Filter comandas for current table
  const tableComandas = useMemo(() => {
    if (!selectedTable) return [];
    return allComandas.filter(c => c.table_id === selectedTable.id);
  }, [allComandas, selectedTable]);

  useEffect(() => {
    fetchTables();
  }, []);

  // Keep modal synced with comandas data
  useEffect(() => {
    if (detailsModalComanda) {
      const updated = allComandas.find(c => c.session_id === detailsModalComanda.session_id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(detailsModalComanda)) {
        setDetailsModalComanda(updated);
      }
    }
  }, [allComandas, detailsModalComanda]);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('id, number, name')
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      
      // Separate balcão table (number 0) from regular tables
      const balcao = data?.find(t => t.number === 0) || null;
      const regularTables = data?.filter(t => t.number !== 0) || [];
      
      setBalcaoTable(balcao);
      setTables(regularTables);
    } catch (err) {
      console.error('Error fetching tables:', err);
      toast.error('Erro ao carregar mesas');
    } finally {
      setLoadingTables(false);
    }
  };

  // Handle balcão mode toggle
  const handleBalcaoModeChange = (enabled: boolean) => {
    setIsBalcaoMode(enabled);
    if (enabled && balcaoTable) {
      setSelectedTable(balcaoTable);
      setDeliveryType('balcao');
      setSelectedComanda(null);
    } else {
      setSelectedTable(null);
      setDeliveryType('balcao');
      setSelectedComanda(null);
      setClientName('');
    }
  };

  // Handle table selection
  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setSelectedComanda(null);
    setClientName('');
  };

  // Handle selecting an existing comanda
  const handleSelectComanda = (comanda: Comanda) => {
    setSelectedComanda(comanda);
    setClientName(comanda.client_name);
  };

  // Handle typing new client name - auto deselects comanda
  const handleClientNameChange = (name: string) => {
    setClientName(name);
    // If user is typing, they're creating a new comanda
    if (selectedComanda && name !== selectedComanda.client_name) {
      setSelectedComanda(null);
    }
  };

  // Handle deselecting comanda
  const handleDeselectComanda = () => {
    setSelectedComanda(null);
    setClientName('');
  };

  // Format time elapsed
  const formatTimeElapsed = (dateStr: string) => {
    const start = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Handle mark all orders as paid
  const handleMarkPaid = async (comanda: Comanda) => {
    const unpaidOrders = comanda.orders.filter(o => !o.is_paid);
    let allSuccess = true;
    
    for (const order of unpaidOrders) {
      const success = await markOrderPaid(order.id);
      if (!success) allSuccess = false;
    }
    
    if (allSuccess) {
      toast.success('Todos os pedidos marcados como pagos');
      await refetchComandas();
    } else {
      toast.error('Erro ao marcar como paga');
    }
  };

  // Handle mark all orders as unpaid
  const handleMarkUnpaid = async (comanda: Comanda) => {
    const paidOrders = comanda.orders.filter(o => o.is_paid);
    let allSuccess = true;
    
    for (const order of paidOrders) {
      const success = await markOrderUnpaid(order.id);
      if (!success) allSuccess = false;
    }
    
    if (allSuccess) {
      toast.success('Todos os pedidos marcados como não pagos');
      await refetchComandas();
    } else {
      toast.error('Erro ao marcar como não paga');
    }
  };

  // Handle close comanda from modal
  const handleCloseFromModal = (comanda: Comanda) => {
    setDetailsModalComanda(null);
    confirmCloseComanda(comanda);
  };

  // Handle close comanda
  const handleCloseComanda = async () => {
    if (!comandaToClose) return;
    
    const success = await closeComanda(comandaToClose.session_id);
    if (success) {
      toast.success('Comanda fechada');
      if (selectedComanda?.session_id === comandaToClose.session_id) {
        setSelectedComanda(null);
        setClientName('');
      }
    } else {
      toast.error('Erro ao fechar comanda');
    }
    setCloseDialogOpen(false);
    setComandaToClose(null);
  };

  // Confirm close comanda
  const confirmCloseComanda = (comanda: Comanda) => {
    setComandaToClose(comanda);
    setCloseDialogOpen(true);
  };

  const addToCart = (item: typeof menuItems[0]) => {
    const existingItem = cart.find(c => c.menuItemId === item.id);
    
    if (existingItem) {
      setCart(cart.map(c => 
        c.menuItemId === item.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        id: crypto.randomUUID(),
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        category: item.category
      }]);
    }
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prevCart => prevCart
      .map(item => {
        if (item.id === cartItemId) {
          return { ...item, quantity: item.quantity + delta };
        }
        return item;
      })
      .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(cart.filter(item => item.id !== cartItemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!selectedTable) {
      toast.error('Selecione uma mesa');
      return;
    }
    if (!clientName.trim()) {
      toast.error('Informe o nome do cliente');
      return;
    }
    if (cart.length === 0) {
      toast.error('Adicione itens ao pedido');
      return;
    }
    if (!deliveryType) {
      toast.error('Selecione o tipo de entrega');
      return;
    }

    // Determine if we're creating a new comanda or using existing

    setIsSubmitting(true);

    try {
      let sessionId: string;

      // If using existing comanda, use its session
      if (selectedComanda) {
        sessionId = selectedComanda.session_id;
      } else {
        // Create a new client session
        const { data: session, error: sessionError } = await supabase
          .from('client_sessions')
          .insert({
            table_id: selectedTable.id,
            client_name: clientName.trim(),
            device_fingerprint: `manual-${Date.now()}`
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sessionId = session.id;
      }

      // Create the order
      const orderItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        menuItemId: item.menuItemId
      }));

      // Check if ALL items are service items (won't go to kitchen)
      const hasOnlyServiceItems = cart.every(item => item.category === 'servicos');
      
      const { data: orderData, error: orderError } = await createOrder(
        selectedTable.id,
        sessionId,
        orderItems,
        notes || undefined,
        deliveryType,
        hasOnlyServiceItems ? 'delivered' : undefined // Skip kitchen for service-only orders
      );

      if (orderError) throw new Error(orderError);

      if (hasOnlyServiceItems) {
        toast.success('Serviço registrado!');
      } else {
        toast.success('Pedido enviado para a cozinha!');
      }
      
      // Reset form - keep comanda selected if adding to existing
      setCart([]);
      setNotes('');
      
      if (selectedComanda) {
        // Refresh comandas to update the selected one
        refetchComandas();
      } else {
        // Full reset for new order
        setDeliveryType('balcao');
        setClientName('');
        setSelectedTable(null);
        setIsBalcaoMode(false);
      }
    } catch (err: any) {
      console.error('Error creating order:', err);
      toast.error('Erro ao criar pedido: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Normalize string to remove accents for search
  const normalizeString = (str: string) => 
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Filter and group menu items by category
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return menuItems;
    const term = normalizeString(searchTerm);
    return menuItems.filter(item => 
      normalizeString(item.name).includes(term) || 
      normalizeString(categoryLabels[item.category] || item.category).includes(term)
    );
  }, [menuItems, searchTerm]);

  const itemsByCategory = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof filteredItems>);
  }, [filteredItems]);

  // Check if a table has open comandas
  const getTableComandaCount = (tableId: string) => {
    return allComandas.filter(c => c.table_id === tableId).length;
  };

  if (loadingTables || loadingMenu) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Novo Pedido</h1>
        <p className="text-muted-foreground">Crie pedidos para clientes sem celular</p>
      </div>

      {/* Top Row - Mesa/Cliente and Menu Items */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
        {/* Left Column - Table & Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Mesa e Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Balcão Mode Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/30">
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="balcao-mode" className="font-medium">Sem Mesa (Balcão)</Label>
                  <p className="text-xs text-muted-foreground">Cliente avulso, sem mesa física</p>
                </div>
              </div>
              <Switch
                id="balcao-mode"
                checked={isBalcaoMode}
                onCheckedChange={handleBalcaoModeChange}
                disabled={!balcaoTable}
              />
            </div>

            {/* Table Selection - hidden when balcão mode */}
            {!isBalcaoMode && (
              <div className="space-y-2">
                <Label>Selecione a Mesa</Label>
                <div className="grid grid-cols-4 gap-2">
                  {tables.map(table => {
                    const comandaCount = getTableComandaCount(table.id);
                    return (
                      <Button
                        key={table.id}
                        variant={selectedTable?.id === table.id ? 'default' : 'outline'}
                        className="h-auto py-3 flex flex-col relative"
                        onClick={() => handleSelectTable(table)}
                      >
                        {comandaCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                            {comandaCount}
                          </span>
                        )}
                        <span className="text-lg font-bold">{table.number}</span>
                        <span className="text-xs truncate w-full">{table.name}</span>
                      </Button>
                    );
                  })}
                </div>
                {tables.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma mesa ativa
                  </p>
                )}
              </div>
            )}

            {/* Comandas Section - shown when table is selected or balcão mode */}
            {selectedTable && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Comandas Abertas {isBalcaoMode ? 'no Balcão' : `na Mesa ${selectedTable.number}`}
                </Label>

                {loadingComandas ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : tableComandas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                    Nenhuma comanda aberta
                  </p>
                ) : (
                  <ScrollArea className="h-[180px]">
                    <div className="space-y-2 pr-4">
                      {tableComandas.map(comanda => (
                        <div
                          key={comanda.session_id}
                          className={`p-3 border rounded-lg transition-colors ${
                            selectedComanda?.session_id === comanda.session_id 
                              ? 'border-primary bg-primary/10' 
                              : 'hover:bg-accent/30'
                          }`}
                        >
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => handleSelectComanda(comanda)}
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{comanda.client_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={comanda.unpaid_total === 0 ? 'default' : 'destructive'} className="text-xs">
                                {comanda.unpaid_total === 0 ? 'Pago' : `R$ ${comanda.unpaid_total.toFixed(2)}`}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailsModalComanda(comanda);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div 
                            className="flex items-center gap-4 mt-1 text-sm text-muted-foreground cursor-pointer"
                            onClick={() => handleSelectComanda(comanda)}
                          >
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              R$ {comanda.total.toFixed(2)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeElapsed(comanda.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Selected comanda indicator */}
                {selectedComanda && (
                  <div className="p-3 border-2 border-primary rounded-lg bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Adicionando à comanda de:</p>
                        <p className="font-semibold">{selectedComanda.client_name}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={handleDeselectComanda}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="clientName"
                  placeholder={selectedComanda ? selectedComanda.client_name : "Digite o nome para nova comanda..."}
                  value={clientName}
                  onChange={(e) => handleClientNameChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              {selectedComanda && (
                <p className="text-xs text-muted-foreground">
                  Adicionando à comanda existente. Digite outro nome para criar nova.
                </p>
              )}
            </div>

            {/* Delivery Type */}
            <div className="space-y-2">
              <Label>Tipo de Entrega</Label>
              <RadioGroup
                value={deliveryType || ''}
                onValueChange={(value) => setDeliveryType(value as 'mesa' | 'balcao')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer flex-1">
                  <RadioGroupItem value="mesa" id="mesa" />
                  <Label htmlFor="mesa" className="flex items-center gap-2 cursor-pointer flex-1">
                    <MapPin className="h-4 w-4" />
                    Na mesa
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer flex-1">
                  <RadioGroupItem value="balcao" id="balcao" />
                  <Label htmlFor="balcao" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Store className="h-4 w-4" />
                    No balcão
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Sem cebola, bem passado..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Menu Items with Search */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">2. Itens do Cardápio</CardTitle>
            
            {/* Items from Selected Comanda - Quick Add */}
            {selectedComanda && selectedComanda.items.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Itens da Comanda ({selectedComanda.client_name})
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {/* Aggregate items from selected comanda */}
                  {Object.values(
                    selectedComanda.items.reduce((acc, item) => {
                      const key = item.item_name;
                      if (!acc[key]) {
                        acc[key] = { ...item, total_qty: 0 };
                      }
                      acc[key].total_qty += item.quantity;
                      return acc;
                    }, {} as Record<string, typeof selectedComanda.items[0] & { total_qty: number }>)
                  ).slice(0, 6).map((item) => {
                    const menuItem = menuItems.find(m => m.name === item.item_name);
                    const cartItem = menuItem ? cart.find(c => c.menuItemId === menuItem.id) : null;
                    
                    return (
                      <div
                        key={item.item_name}
                        className="flex items-center justify-between p-2 bg-background rounded-md border"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{item.item_name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-primary font-bold">
                              R$ {item.item_price.toFixed(2)}
                            </p>
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              {item.total_qty}x pedido
                            </Badge>
                          </div>
                        </div>
                        {menuItem && (
                          cartItem ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(cartItem.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-5 text-center text-xs font-medium">
                                {cartItem.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(cartItem.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 px-2 text-xs shrink-0"
                              onClick={() => addToCart(menuItem)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Quick Access Items */}
            <div className="mt-3 p-3 bg-accent/20 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">⚡ Acesso Rápido</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Entrada do clube', price: 10, icon: Ticket },
                  { name: 'Piscina', price: 20, icon: Waves },
                  { name: 'Churrasqueira', price: 50, icon: Flame },
                  { name: 'Café da manhã', price: 45, icon: Coffee },
                ].map((quickItem) => {
                  const menuItem = menuItems.find(item => 
                    item.name.toLowerCase() === quickItem.name.toLowerCase()
                  );
                  const cartItem = cart.find(c => 
                    menuItem && c.menuItemId === menuItem.id
                  );
                  const IconComponent = quickItem.icon;
                  
                  return (
                    <div
                      key={quickItem.name}
                      className="flex items-center justify-between p-2 bg-background rounded-md border"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComponent className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{quickItem.name}</p>
                          <p className="text-xs text-primary font-bold">
                            R$ {menuItem?.price.toFixed(2) || quickItem.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {menuItem && (
                        cartItem ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(cartItem.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-5 text-center text-xs font-medium">
                              {cartItem.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(cartItem.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 px-2 text-xs shrink-0"
                            onClick={() => addToCart(menuItem)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {Object.keys(itemsByCategory).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum item encontrado
                  </p>
                ) : (
                  Object.entries(itemsByCategory).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2 sticky top-0 bg-card py-1">
                        {categoryLabels[category] || category}
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {items.map(item => {
                          const cartItem = cart.find(c => c.menuItemId === item.id);
                          const isUnavailable = item.stock_quantity === 0;
                          
                          return (
                            <div 
                              key={item.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isUnavailable ? 'opacity-50 bg-muted' : 'hover:bg-accent/30'
                              }`}
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-sm text-primary font-semibold">
                                  R$ {item.price.toFixed(2)}
                                </p>
                              </div>
                              {isUnavailable ? (
                                <Badge variant="secondary" className="text-xs shrink-0">Esgotado</Badge>
                              ) : cartItem ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(cartItem.id, -1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">
                                    {cartItem.quantity}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(cartItem.id, 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="shrink-0"
                                  onClick={() => addToCart(item)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Adicionar
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Cart Summary (full width) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            3. Resumo do Pedido
            {cartItemsCount > 0 && (
              <Badge variant="secondary">{cartItemsCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Carrinho vazio</p>
              <p className="text-sm">Adicione itens do cardápio</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                {selectedTable && (
                  <div className="p-3 bg-accent/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Mesa</p>
                    <p className="font-semibold">{selectedTable.number} - {selectedTable.name}</p>
                  </div>
                )}
                {clientName && (
                  <div className="p-3 bg-accent/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-semibold">{clientName}</p>
                  </div>
                )}
                {deliveryType && (
                  <div className="p-3 bg-accent/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Entrega</p>
                    <p className="font-semibold flex items-center gap-1">
                      {deliveryType === 'mesa' ? <><MapPin className="h-4 w-4" /> Na mesa</> : <><Store className="h-4 w-4" /> No balcão</>}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}x R$ {item.price.toFixed(2)} = <span className="font-semibold text-foreground">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                <div className="text-xl font-bold">
                  Total: <span className="text-primary">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <Button
                  size="lg"
                  disabled={
                    !selectedTable || 
                    !clientName.trim() || 
                    cart.length === 0 || 
                    !deliveryType || 
                    isSubmitting
                  }
                  onClick={handleSubmitOrder}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Send className="h-5 w-5 mr-2" />
                  )}
                  {selectedComanda ? 'Adicionar à Comanda' : 'Enviar Pedido'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comanda Details Modal */}
      <ComandaDetailsModal
        comanda={detailsModalComanda}
        open={!!detailsModalComanda}
        onOpenChange={(open) => !open && setDetailsModalComanda(null)}
        onMarkPaid={handleMarkPaid}
        onMarkUnpaid={handleMarkUnpaid}
        onClose={handleCloseFromModal}
        onMarkOrderPaid={async (orderId) => {
          await markOrderPaid(orderId);
        }}
        onMarkOrderUnpaid={async (orderId) => {
          await markOrderUnpaid(orderId);
        }}
        onAddPartialPayment={addPartialPayment}
      />

      {/* Close Comanda Confirmation Dialog */}
      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar Comanda</AlertDialogTitle>
            <AlertDialogDescription>
              {comandaToClose && comandaToClose.unpaid_total > 0 ? (
                <>
                  A comanda de <strong>{comandaToClose?.client_name}</strong> tem pedidos não pagos 
                  (R$ {comandaToClose?.unpaid_total.toFixed(2)} de R$ {comandaToClose?.total.toFixed(2)}). Deseja fechar mesmo assim?
                </>
              ) : (
                <>
                  Tem certeza que deseja fechar a comanda de <strong>{comandaToClose?.client_name}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {comandaToClose && comandaToClose.unpaid_total > 0 && (
              <Button
                variant="outline"
                onClick={async () => {
                  await handleMarkPaid(comandaToClose);
                  await handleCloseComanda();
                }}
              >
                Pagar Tudo e Fechar
              </Button>
            )}
            <AlertDialogAction onClick={handleCloseComanda}>
              {comandaToClose && comandaToClose.unpaid_total > 0 ? 'Fechar sem Pagar' : 'Fechar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Atendimento;
