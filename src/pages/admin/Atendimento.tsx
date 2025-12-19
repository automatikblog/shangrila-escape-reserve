import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMenuItems, categoryLabels, MenuItem } from '@/hooks/useMenuItems';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useComandas, Comanda } from '@/hooks/useComandas';
import { useFrequentItems } from '@/hooks/useFrequentItems';
import { useTablesWithActivity } from '@/hooks/useTablesWithActivity';
import { useSettings } from '@/hooks/useSettings';
import { ComandaDetailsModal } from '@/components/admin/ComandaDetailsModal';
import { CustomItemModal, CustomIngredient } from '@/components/admin/CustomItemModal';
import { BaldaoQuantityModal } from '@/components/admin/BaldaoQuantityModal';
import { ComandaHistoryView } from '@/components/admin/ComandaHistoryView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Minus, Trash2, ShoppingCart, User, MapPin, Store, Send, Search, Coffee, Clock, DollarSign, Check, X, Eye, Ticket, Waves, Flame, TrendingUp, Beaker, Beer, History, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  goes_to_kitchen?: boolean;
  custom_ingredients?: CustomIngredient[];
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
  const { tables: tablesWithActivity, isLoading: loadingTables } = useTablesWithActivity();
  const { settings } = useSettings();
  
  const [balcaoTable, setBalcaoTable] = useState<Table | null>(null);
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
  const [newComandaDialogOpen, setNewComandaDialogOpen] = useState(false);
  
  // Customizable item modal
  const [customizableItem, setCustomizableItem] = useState<MenuItem | null>(null);
  
  // Baldão quantity modal
  const [baldaoItem, setBaldaoItem] = useState<MenuItem | null>(null);
  
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
    updateDiscount,
  } = useComandas();

  // Filter tables: separate balcão (number 0) from regular tables
  const tables = useMemo(() => {
    return tablesWithActivity.filter(t => t.number !== 0);
  }, [tablesWithActivity]);

  // Get balcão table
  useEffect(() => {
    const balcao = tablesWithActivity.find(t => t.number === 0);
    if (balcao) {
      setBalcaoTable({ id: balcao.id, number: balcao.number, name: balcao.name });
    }
  }, [tablesWithActivity]);

  // Filter comandas for current table
  const tableComandas = useMemo(() => {
    if (!selectedTable) return [];
    return allComandas.filter(c => c.table_id === selectedTable.id);
  }, [allComandas, selectedTable]);

  // Get balcão comandas (comandas without physical table)
  const balcaoComandas = useMemo(() => {
    if (!balcaoTable) return [];
    return allComandas.filter(c => c.table_id === balcaoTable.id);
  }, [allComandas, balcaoTable]);

  // Get comanda color based on activity status
  const getComandaColor = (comanda: Comanda): string => {
    if (comanda.orders.length === 0) {
      return 'bg-yellow-100 border-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-600';
    }
    const lastOrderTime = Math.max(...comanda.orders.map(o => new Date(o.created_at).getTime()));
    const minutesSinceOrder = (Date.now() - lastOrderTime) / (1000 * 60);
    if (minutesSinceOrder >= settings.table_inactivity_minutes) {
      return 'bg-yellow-100 border-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-600';
    }
    return 'bg-green-100 border-green-400 dark:bg-green-900/30 dark:border-green-600';
  };

  // Get table name/number for a comanda
  const getComandaTableLabel = (comanda: Comanda): string => {
    if (balcaoTable && comanda.table_id === balcaoTable.id) {
      return 'Balcão';
    }
    const table = tablesWithActivity.find(t => t.id === comanda.table_id);
    return table ? `Mesa ${table.number}` : 'Mesa';
  };

  // Handle creating new comanda with table selection
  const handleCreateNewComanda = (tableId: string) => {
    const tableData = tablesWithActivity.find(t => t.id === tableId);
    if (tableData) {
      setSelectedTable({ id: tableData.id, number: tableData.number, name: tableData.name });
      setIsBalcaoMode(tableData.number === 0);
      setDeliveryType(tableData.number === 0 ? 'balcao' : 'balcao');
      setSelectedComanda(null);
      setClientName('');
      setNewComandaDialogOpen(false);
    }
  };

  // Handle selecting an existing comanda
  const handleSelectComanda = (comanda: Comanda) => {
    const tableData = tablesWithActivity.find(t => t.id === comanda.table_id);
    if (tableData) {
      setSelectedTable({ id: tableData.id, number: tableData.number, name: tableData.name });
      setIsBalcaoMode(tableData.number === 0);
    }
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

  // Check if item is a baldão (bucket) item
  const isBaldaoItem = (item: MenuItem) => {
    return item.category === 'baldes' || item.name.toLowerCase().includes('balde');
  };

  const addToCart = (item: MenuItem, customIngredients?: CustomIngredient[], baldaoQuantity?: number) => {
    // If item is customizable and no custom ingredients provided, open modal
    if (item.is_customizable && !customIngredients) {
      setCustomizableItem(item);
      return;
    }
    
    // If item is a baldão and no quantity specified, open quantity modal
    if (isBaldaoItem(item) && baldaoQuantity === undefined) {
      setBaldaoItem(item);
      return;
    }
    
    // Build item name with quantity info for baldão
    let itemName = item.name;
    if (baldaoQuantity !== undefined) {
      // Replace the quantity in the name or append it
      const match = item.name.match(/(\d+)\s*unidades?/i);
      if (match) {
        itemName = item.name.replace(/\d+\s*unidades?/i, `${baldaoQuantity} unidades`);
      } else {
        itemName = `${item.name} (${baldaoQuantity} unidades)`;
      }
    }
    
    // For customizable items with custom ingredients, always add as new entry
    if (customIngredients) {
      setCart([...cart, {
        id: crypto.randomUUID(),
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        category: item.category,
        goes_to_kitchen: item.goes_to_kitchen,
        custom_ingredients: customIngredients
      }]);
      return;
    }
    
    // For baldão items, always add as new entry (since quantity varies)
    if (baldaoQuantity !== undefined) {
      setCart([...cart, {
        id: crypto.randomUUID(),
        menuItemId: item.id,
        name: itemName,
        price: item.price,
        quantity: 1,
        category: item.category,
        goes_to_kitchen: item.goes_to_kitchen
      }]);
      return;
    }
    
    const existingItem = cart.find(c => c.menuItemId === item.id && !c.custom_ingredients);
    
    if (existingItem) {
      setCart(cart.map(c => 
        c.id === existingItem.id 
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
        category: item.category,
        goes_to_kitchen: item.goes_to_kitchen
      }]);
    }
  };
  
  const handleBaldaoConfirm = (item: MenuItem, quantity: number, customPrice: number) => {
    // Create a modified item with custom price and name
    const modifiedItem: MenuItem = {
      ...item,
      price: customPrice,
    };
    addToCart(modifiedItem, undefined, quantity);
    setBaldaoItem(null);
  };
  
  const handleCustomItemConfirm = (ingredients: CustomIngredient[]) => {
    if (customizableItem) {
      addToCart(customizableItem, ingredients);
      setCustomizableItem(null);
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

      // Check if ALL items don't go to kitchen
      const hasNoKitchenItems = cart.every(item => item.goes_to_kitchen === false);
      
      const { data: orderData, error: orderError } = await createOrder(
        selectedTable.id,
        sessionId,
        orderItems,
        notes || undefined,
        deliveryType,
        hasNoKitchenItems ? 'delivered' : undefined // Skip kitchen for non-kitchen orders
      );

      if (orderError) throw new Error(orderError);

      if (hasNoKitchenItems) {
        toast.success('Pedido registrado!');
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

  // Filter and group menu items by category - only show sellable items
  const filteredItems = useMemo(() => {
    const sellableItems = menuItems.filter(item => item.is_sellable);
    if (!searchTerm.trim()) return sellableItems;
    const term = normalizeString(searchTerm);
    return sellableItems.filter(item => 
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
      <Tabs defaultValue="novo-pedido" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="novo-pedido" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Novo Pedido
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="novo-pedido" className="mt-6">
          <div className="mb-4">
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
            {/* Nova Comanda Button + All Comandas List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Comandas Abertas</Label>
                <Button
                  onClick={() => setNewComandaDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Nova Comanda
                </Button>
              </div>
              
              {/* All Comandas List */}
              {loadingComandas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : allComandas.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-muted/30">
                  <Coffee className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhuma comanda aberta</p>
                  <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Comanda" para começar</p>
                </div>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2 pr-4">
                    {allComandas.map(comanda => (
                      <div
                        key={comanda.session_id}
                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${getComandaColor(comanda)} ${
                          selectedComanda?.session_id === comanda.session_id 
                            ? 'ring-2 ring-primary ring-offset-2' 
                            : 'hover:scale-[1.01]'
                        }`}
                        onClick={() => handleSelectComanda(comanda)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 opacity-60" />
                            <span className="font-semibold">{comanda.client_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getComandaTableLabel(comanda)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={comanda.unpaid_total === 0 ? 'default' : 'destructive'} className="text-xs">
                              {comanda.unpaid_total === 0 ? 'Pago' : `R$ ${comanda.remaining_total.toFixed(2)}`}
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
                        <div className="flex items-center gap-4 mt-1 text-sm opacity-75">
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
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-200 border border-green-400 dark:bg-green-900/50"></span> Ativa
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-yellow-200 border border-yellow-400 dark:bg-yellow-900/50"></span> Precisa atenção
                </span>
              </div>
            </div>

            {/* Selected Comanda Indicator */}
            {selectedComanda && (
              <div className="p-3 border-2 border-primary rounded-lg bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Adicionando à comanda de:</p>
                    <p className="font-semibold">{selectedComanda.client_name} • {getComandaTableLabel(selectedComanda)}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleDeselectComanda}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Client Name - only show when creating new comanda */}
            {selectedTable && !selectedComanda && (
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="clientName"
                    placeholder="Digite o nome do cliente..."
                    value={clientName}
                    onChange={(e) => handleClientNameChange(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Delivery Type */}
            {selectedTable && (
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
            )}

            {/* Notes */}
            {selectedTable && (
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
            )}
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {/* Aggregate items from selected comanda, ordered by most recent */}
                  {(() => {
                    // Get unique items with their latest created_at
                    const itemsMap = new Map<string, typeof selectedComanda.items[0] & { total_qty: number; latest_at: string }>();
                    
                    for (const item of selectedComanda.items) {
                      const existing = itemsMap.get(item.item_name);
                      if (!existing) {
                        itemsMap.set(item.item_name, { ...item, total_qty: item.quantity, latest_at: item.created_at });
                      } else {
                        existing.total_qty += item.quantity;
                        // Keep the most recent timestamp
                        if (item.created_at > existing.latest_at) {
                          existing.latest_at = item.created_at;
                        }
                      }
                    }
                    
                    // Sort by most recent first and take top 4
                    return Array.from(itemsMap.values())
                      .sort((a, b) => b.latest_at.localeCompare(a.latest_at))
                      .slice(0, 4)
                      .map((item) => {
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
                      });
                  })()}
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
                          const cartItem = cart.find(c => c.menuItemId === item.id && !c.custom_ingredients);
                          const isUnavailable = item.stock_quantity === 0;
                          const isBaldao = isBaldaoItem(item);
                          
                          return (
                            <div 
                              key={item.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isUnavailable ? 'opacity-50 bg-muted' : 'hover:bg-accent/30'
                              }`}
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="flex items-center gap-1">
                                  <p className="font-medium text-sm truncate">{item.name}</p>
                                  {item.is_customizable && (
                                    <Beaker className="h-3 w-3 text-blue-500 shrink-0" />
                                  )}
                                  {isBaldao && (
                                    <Beer className="h-3 w-3 text-amber-500 shrink-0" />
                                  )}
                                </div>
                                <p className="text-sm text-primary font-semibold">
                                  R$ {item.price.toFixed(2)}
                                </p>
                              </div>
                              {isUnavailable ? (
                                <Badge variant="secondary" className="text-xs shrink-0">Esgotado</Badge>
                              ) : cartItem && !item.is_customizable && !isBaldao ? (
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
                                  variant={item.is_customizable || isBaldao ? "outline" : "secondary"}
                                  className="shrink-0"
                                  onClick={() => addToCart(item)}
                                >
                                  {item.is_customizable ? (
                                    <>
                                      <Beaker className="h-4 w-4 mr-1" />
                                      Montar
                                    </>
                                  ) : isBaldao ? (
                                    <>
                                      <Beer className="h-4 w-4 mr-1" />
                                      Montar
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-1" />
                                      Adicionar
                                    </>
                                  )}
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
        onClose={handleCloseFromModal}
        onMarkOrderPaid={async (orderId, paymentMethod) => {
          await markOrderPaid(orderId, paymentMethod);
        }}
        onMarkOrderUnpaid={async (orderId) => {
          await markOrderUnpaid(orderId);
        }}
        onAddPartialPayment={addPartialPayment}
        onUpdateDiscount={updateDiscount}
      />
      
      {/* Custom Item Modal */}
      <CustomItemModal
        open={!!customizableItem}
        onOpenChange={(open) => !open && setCustomizableItem(null)}
        item={customizableItem}
        allItems={menuItems}
        onConfirm={handleCustomItemConfirm}
      />
      
      {/* Baldão Quantity Modal */}
      <BaldaoQuantityModal
        item={baldaoItem}
        open={!!baldaoItem}
        onOpenChange={(open) => !open && setBaldaoItem(null)}
        onConfirm={handleBaldaoConfirm}
      />

      {/* New Comanda Dialog - Choose Table */}
      <Dialog open={newComandaDialogOpen} onOpenChange={setNewComandaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Comanda</DialogTitle>
            <DialogDescription>
              Escolha onde será a comanda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Balcão option */}
            {balcaoTable && (
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-1"
                onClick={() => handleCreateNewComanda(balcaoTable.id)}
              >
                <Coffee className="h-6 w-6 text-primary" />
                <span className="font-semibold">Sem Mesa (Balcão)</span>
                <span className="text-xs text-muted-foreground">Cliente avulso</span>
              </Button>
            )}
            
            {/* Tables grid */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Ou escolha uma mesa:</Label>
              <div className="grid grid-cols-4 gap-2">
                {tables.map(table => (
                  <Button
                    key={table.id}
                    variant="outline"
                    className="h-auto py-3 flex flex-col"
                    onClick={() => handleCreateNewComanda(table.id)}
                  >
                    <span className="text-lg font-bold">{table.number}</span>
                    <span className="text-xs truncate w-full text-center">{table.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <ComandaHistoryView />
        </TabsContent>
      </Tabs>

      {/* Floating Send Order Button */}
      {cart.length > 0 && (
        <Button
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
          className="fixed bottom-6 right-6 z-50 h-14 px-6 shadow-xl animate-pulse hover:animate-none bg-primary hover:bg-primary/90 text-primary-foreground rounded-full gap-3"
          size="lg"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              <span className="font-bold">{cartItemsCount}</span>
              <span className="mx-1">•</span>
              <span className="font-bold">R$ {cartTotal.toFixed(2)}</span>
              <Send className="h-5 w-5 ml-1" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default Atendimento;
