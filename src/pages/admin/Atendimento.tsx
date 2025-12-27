import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMenuItems, categoryLabels, MenuItem } from '@/hooks/useMenuItems';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useComandas, Comanda, Companion } from '@/hooks/useComandas';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Minus, Trash2, ShoppingCart, User, MapPin, Store, Send, Search, Coffee, Clock, DollarSign, Check, X, Eye, Ticket, Waves, Flame, TrendingUp, Beaker, Beer, History, PlusCircle, ArrowLeft, ClipboardList, Baby, Users } from 'lucide-react';
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

type Step = 'comanda' | 'items' | 'review';

const Atendimento: React.FC = () => {
  const { items: menuItems, isLoading: loadingMenu } = useMenuItems();
  const { createOrder } = useRealtimeOrders();
  const { items: frequentItems, isLoading: loadingFrequent } = useFrequentItems(6);
  const { tables: tablesWithActivity, isLoading: loadingTables } = useTablesWithActivity();
  const { settings } = useSettings();
  
  // Step control
  const [currentStep, setCurrentStep] = useState<Step>('comanda');
  
  const [balcaoTable, setBalcaoTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isBalcaoMode, setIsBalcaoMode] = useState(false);
  const [clientName, setClientName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<'mesa' | 'balcao' | null>('balcao');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Comanda management
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [comandaToClose, setComandaToClose] = useState<Comanda | null>(null);
  const [detailsModalComanda, setDetailsModalComanda] = useState<Comanda | null>(null);
  const [newComandaDialogOpen, setNewComandaDialogOpen] = useState(false);
  const [newComandaClientName, setNewComandaClientName] = useState('');
  const [newComandaCompanions, setNewComandaCompanions] = useState<Companion[]>([]);
  const [newCompanionInput, setNewCompanionInput] = useState('');
  const [newCompanionIsChild, setNewCompanionIsChild] = useState(false);
  
  // Customizable item modal
  const [customizableItem, setCustomizableItem] = useState<MenuItem | null>(null);
  
  // Baldão quantity modal
  const [baldaoItem, setBaldaoItem] = useState<MenuItem | null>(null);
  
  // Fetch all active comandas
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
    updateItemQuantity,
    deleteItem,
  } = useComandas();

  // Sync detailsModalComanda with updated data from allComandas
  useEffect(() => {
    if (detailsModalComanda) {
      const updatedComanda = allComandas.find(c => c.session_id === detailsModalComanda.session_id);
      if (updatedComanda) {
        setDetailsModalComanda(updatedComanda);
      }
    }
  }, [allComandas, detailsModalComanda?.session_id]);

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

  // Get balcão comandas
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
    if (!newComandaClientName.trim()) {
      toast.error('Digite o nome do cliente');
      return;
    }
    const tableData = tablesWithActivity.find(t => t.id === tableId);
    if (tableData) {
      setSelectedTable({ id: tableData.id, number: tableData.number, name: tableData.name });
      setIsBalcaoMode(tableData.number === 0);
      setDeliveryType(tableData.number === 0 ? 'balcao' : 'balcao');
      setSelectedComanda(null);
      setClientName(newComandaClientName.trim());
      // Store companions for later use when creating the session
      (window as any).__pendingCompanions = newComandaCompanions.length > 0 ? [...newComandaCompanions] : null;
      setNewComandaDialogOpen(false);
      setNewComandaClientName('');
      setNewComandaCompanions([]);
      setNewCompanionInput('');
      setNewCompanionIsChild(false);
      setCurrentStep('items');
    }
  };

  const handleAddNewCompanion = () => {
    const name = newCompanionInput.trim();
    if (name && !newComandaCompanions.some(c => c.name === name)) {
      setNewComandaCompanions([...newComandaCompanions, { name, isChild: newCompanionIsChild }]);
      setNewCompanionInput('');
      setNewCompanionIsChild(false);
    }
  };

  const handleRemoveNewCompanion = (index: number) => {
    setNewComandaCompanions(newComandaCompanions.filter((_, i) => i !== index));
  };

  const handleNewCompanionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewCompanion();
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
    setCurrentStep('items');
  };

  // Handle typing new client name
  const handleClientNameChange = (name: string) => {
    setClientName(name);
    if (selectedComanda && name !== selectedComanda.client_name) {
      setSelectedComanda(null);
    }
  };

  // Handle deselecting comanda
  const handleDeselectComanda = () => {
    setSelectedComanda(null);
    setClientName('');
  };

  // Handle going back from items step
  const handleBackToComanda = () => {
    setCart([]);
    setNotes('');
    setSelectedTable(null);
    setSelectedComanda(null);
    setClientName('');
    setCurrentStep('comanda');
  };

  // Handle going back from review step
  const handleBackToItems = () => {
    setCurrentStep('items');
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

  // Check if item is a baldão
  const isBaldaoItem = (item: MenuItem) => {
    return item.category === 'baldes' || item.name.toLowerCase().includes('balde');
  };

  const addToCart = (item: MenuItem, customIngredients?: CustomIngredient[], baldaoQuantity?: number) => {
    if (item.is_customizable && !customIngredients) {
      setCustomizableItem(item);
      return;
    }
    
    if (isBaldaoItem(item) && baldaoQuantity === undefined) {
      setBaldaoItem(item);
      return;
    }
    
    let itemName = item.name;
    if (baldaoQuantity !== undefined) {
      const match = item.name.match(/(\d+)\s*unidades?/i);
      if (match) {
        itemName = item.name.replace(/\d+\s*unidades?/i, `${baldaoQuantity} unidades`);
      } else {
        itemName = `${item.name} (${baldaoQuantity} unidades)`;
      }
    }
    
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

    setIsSubmitting(true);

    try {
      let sessionId: string;

      if (selectedComanda) {
        sessionId = selectedComanda.session_id;
      } else {
        // Get pending companions stored from the new comanda dialog
        const pendingCompanions = (window as any).__pendingCompanions;
        (window as any).__pendingCompanions = null;
        
        const { data: session, error: sessionError } = await supabase
          .from('client_sessions')
          .insert({
            table_id: selectedTable.id,
            client_name: clientName.trim(),
            device_fingerprint: `manual-${Date.now()}`,
            companions: pendingCompanions
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sessionId = session.id;
      }

      const orderItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        menuItemId: item.menuItemId
      }));

      const hasNoKitchenItems = cart.every(item => item.goes_to_kitchen === false);
      
      const { data: orderData, error: orderError } = await createOrder(
        selectedTable.id,
        sessionId,
        orderItems,
        notes || undefined,
        deliveryType,
        hasNoKitchenItems ? 'delivered' : undefined
      );

      if (orderError) throw new Error(orderError);

      if (hasNoKitchenItems) {
        toast.success('Pedido registrado!');
      } else {
        toast.success('Pedido enviado para a cozinha!');
      }
      
      // Reset form
      setCart([]);
      setNotes('');
      setCurrentStep('comanda');
      
      if (selectedComanda) {
        refetchComandas();
      } else {
        setDeliveryType('balcao');
        setClientName('');
        setSelectedTable(null);
        setIsBalcaoMode(false);
      }
      
      setSelectedComanda(null);
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

  // ==================== STEP 1: COMANDA SELECTION ====================
  const renderComandaStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Novo Pedido</h1>
        <p className="text-muted-foreground">Selecione ou crie uma comanda para começar</p>
      </div>

      {/* Nova Comanda Button */}
      <Button
        onClick={() => setNewComandaDialogOpen(true)}
        size="lg"
        className="w-full h-16 text-lg gap-3"
      >
        <PlusCircle className="h-6 w-6" />
        Nova Comanda
      </Button>

      {/* Comandas List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Comandas Abertas</Label>
          <Badge variant="outline">{allComandas.length} ativas</Badge>
        </div>
        
        {loadingComandas ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : allComandas.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/30">
            <Coffee className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg text-muted-foreground">Nenhuma comanda aberta</p>
            <p className="text-sm text-muted-foreground mt-1">Clique em "Nova Comanda" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allComandas.map(comanda => (
              <div
                key={comanda.session_id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:scale-[1.02] ${getComandaColor(comanda)}`}
                onClick={() => handleSelectComanda(comanda)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 opacity-60 shrink-0" />
                    <span className="font-semibold truncate">{comanda.client_name}</span>
                    {comanda.companions && comanda.companions.length > 0 && (
                      <Badge variant="outline" className="text-xs shrink-0 gap-1">
                        <Users className="h-3 w-3" />
                        +{comanda.companions.length}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {getComandaTableLabel(comanda)}
                  </Badge>
                </div>
                {/* Show companions */}
                {comanda.companions && comanda.companions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {comanda.companions.slice(0, 3).map((comp, idx) => (
                      <span key={idx} className="text-xs text-muted-foreground flex items-center gap-0.5">
                        {comp.isChild && <Baby className="h-3 w-3 text-primary" />}
                        {comp.name}
                        {idx < Math.min(comanda.companions!.length - 1, 2) && ','}
                      </span>
                    ))}
                    {comanda.companions.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{comanda.companions.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm opacity-75">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      R$ {comanda.total.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeElapsed(comanda.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={comanda.remaining_total === 0 ? 'default' : 'destructive'} className="text-xs">
                      {comanda.remaining_total === 0 ? 'Pago' : `R$ ${comanda.remaining_total.toFixed(2)}`}
                    </Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailsModalComanda(comanda);
                      }}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-200 border border-green-400 dark:bg-green-900/50"></span> Ativa
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-yellow-200 border border-yellow-400 dark:bg-yellow-900/50"></span> Precisa atenção
          </span>
        </div>
      </div>
    </div>
  );

  // ==================== STEP 2: ITEMS SELECTION ====================
  const renderItemsStep = () => (
    <div className="space-y-4 animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={handleBackToComanda}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Marcar Itens</h1>
          <p className="text-sm text-muted-foreground">
            {selectedComanda ? (
              <span className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {selectedComanda.client_name}
                </span>
                {selectedComanda.companions && selectedComanda.companions.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {selectedComanda.companions.map((c, i) => (
                      <span key={i} className="flex items-center gap-0.5">
                        {c.isChild && <Baby className="h-3 w-3 text-primary" />}
                        {c.name}{i < selectedComanda.companions!.length - 1 && ','}
                      </span>
                    ))}
                  </span>
                )}
                <span>• {getComandaTableLabel(selectedComanda)}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Nova comanda • {selectedTable?.number === 0 ? 'Balcão' : `Mesa ${selectedTable?.number}`}
              </span>
            )}
          </p>
        </div>
        {/* Cart summary badge */}
        {cart.length > 0 && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {cartItemsCount} itens • R$ {cartTotal.toFixed(2)}
          </Badge>
        )}
      </div>

      {/* Client Name Display for new comanda */}
      {!selectedComanda && clientName && (
        <div className="p-3 border rounded-lg bg-accent/30 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{clientName}</span>
        </div>
      )}

      {/* Items from Selected Comanda - Quick Add */}
      {selectedComanda && selectedComanda.items.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Itens da Comanda ({selectedComanda.client_name})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {(() => {
              const itemsMap = new Map<string, typeof selectedComanda.items[0] & { total_qty: number; latest_at: string }>();
              
              for (const item of selectedComanda.items) {
                const existing = itemsMap.get(item.item_name);
                if (!existing) {
                  itemsMap.set(item.item_name, { ...item, total_qty: item.quantity, latest_at: item.created_at });
                } else {
                  existing.total_qty += item.quantity;
                  if (item.created_at > existing.latest_at) {
                    existing.latest_at = item.created_at;
                  }
                }
              }
              
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
      <div className="p-3 bg-accent/20 rounded-lg">
        <p className="text-xs font-medium text-muted-foreground mb-2">⚡ Acesso Rápido</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Menu Items by Category */}
      <ScrollArea className="h-[calc(100vh-500px)] min-h-[300px]">
        <div className="space-y-6 pr-4 pb-24">
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                {categoryLabels[category] || category}
                <Badge variant="outline" className="text-xs">{items.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map(item => {
                  const cartItem = cart.find(c => c.menuItemId === item.id && !c.custom_ingredients);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-sm text-primary font-bold">R$ {item.price.toFixed(2)}</p>
                      </div>
                      {cartItem ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(cartItem.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {cartItem.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(cartItem.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  // ==================== STEP 3: REVIEW ====================
  const renderReviewStep = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={handleBackToItems}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Revisar Pedido</h1>
          <p className="text-sm text-muted-foreground">Confirme os detalhes antes de enviar</p>
        </div>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-accent/30 rounded-lg">
          <p className="text-xs text-muted-foreground">Cliente</p>
          <p className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            {clientName || 'Não informado'}
          </p>
        </div>
        <div className="p-4 bg-accent/30 rounded-lg">
          <p className="text-xs text-muted-foreground">Local</p>
          <p className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {selectedTable?.number === 0 ? 'Balcão' : `Mesa ${selectedTable?.number} - ${selectedTable?.name}`}
          </p>
        </div>
      </div>

      {/* Cart Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Itens do Pedido ({cartItemsCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity}x R$ {item.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span className="text-primary">R$ {cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Type */}
      <div className="space-y-2">
        <Label>Tipo de Entrega</Label>
        <RadioGroup
          value={deliveryType || ''}
          onValueChange={(value) => setDeliveryType(value as 'mesa' | 'balcao')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer flex-1">
            <RadioGroupItem value="mesa" id="mesa-review" />
            <Label htmlFor="mesa-review" className="flex items-center gap-2 cursor-pointer flex-1">
              <MapPin className="h-4 w-4" />
              Na mesa
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer flex-1">
            <RadioGroupItem value="balcao" id="balcao-review" />
            <Label htmlFor="balcao-review" className="flex items-center gap-2 cursor-pointer flex-1">
              <Store className="h-4 w-4" />
              No balcão
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes-review">Observações (opcional)</Label>
        <Textarea
          id="notes-review"
          placeholder="Sem cebola, bem passado, etc..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <Button
        size="lg"
        className="w-full h-14 text-lg gap-3"
        disabled={
          !selectedTable || 
          !clientName.trim() || 
          cart.length === 0 || 
          !deliveryType || 
          isSubmitting
        }
        onClick={handleSubmitOrder}
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Send className="h-5 w-5" />
            {selectedComanda ? 'Adicionar à Comanda' : 'Confirmar e Enviar'}
          </>
        )}
      </Button>
    </div>
  );

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
          {currentStep === 'comanda' && renderComandaStep()}
          {currentStep === 'items' && renderItemsStep()}
          {currentStep === 'review' && renderReviewStep()}
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <ComandaHistoryView />
        </TabsContent>
      </Tabs>

      {/* Floating Action Button - Only on Items Step with cart items */}
      {currentStep === 'items' && cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex gap-2">
          <Button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || !clientName.trim()}
            className="h-14 px-4 shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground rounded-full gap-2"
            size="lg"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span className="font-bold">Enviar</span>
              </>
            )}
          </Button>
          <Button
            onClick={() => setCurrentStep('review')}
            variant="secondary"
            className="h-14 px-4 shadow-xl rounded-full gap-2"
            size="lg"
          >
            <ClipboardList className="h-5 w-5" />
            <span className="font-bold">{cartItemsCount}</span>
            <span className="mx-1">•</span>
            <span className="font-bold">R$ {cartTotal.toFixed(2)}</span>
          </Button>
        </div>
      )}

      {/* Modals */}
      <ComandaDetailsModal
        comanda={detailsModalComanda}
        open={!!detailsModalComanda}
        onOpenChange={(open) => !open && setDetailsModalComanda(null)}
        onClose={handleCloseFromModal}
        onAddPartialPayment={addPartialPayment}
        onUpdateDiscount={updateDiscount}
        onUpdateItemQuantity={updateItemQuantity}
        onDeleteItem={deleteItem}
      />
      
      <CustomItemModal
        open={!!customizableItem}
        onOpenChange={(open) => !open && setCustomizableItem(null)}
        item={customizableItem}
        allItems={menuItems}
        onConfirm={handleCustomItemConfirm}
      />
      
      <BaldaoQuantityModal
        item={baldaoItem}
        open={!!baldaoItem}
        onOpenChange={(open) => !open && setBaldaoItem(null)}
        onConfirm={handleBaldaoConfirm}
      />

      {/* New Comanda Dialog */}
      <Dialog open={newComandaDialogOpen} onOpenChange={(open) => {
        setNewComandaDialogOpen(open);
        if (!open) {
          setNewComandaClientName('');
          setNewComandaCompanions([]);
          setNewCompanionInput('');
          setNewCompanionIsChild(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Comanda</DialogTitle>
            <DialogDescription>
              Informe o cliente e escolha o local
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Client Name Input */}
            <div className="space-y-2">
              <Label htmlFor="newComandaClientName" className="font-medium">Nome do Cliente</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newComandaClientName"
                  placeholder="Digite o nome do cliente..."
                  value={newComandaClientName}
                  onChange={(e) => setNewComandaClientName(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Companions Section */}
            <div className="space-y-2">
              <Label className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Acompanhantes (opcional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {newComandaCompanions.map((companion, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                    {companion.isChild && <Baby className="h-3 w-3 text-primary" />}
                    {companion.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive/20"
                      onClick={() => handleRemoveNewCompanion(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newCompanionInput}
                  onChange={(e) => setNewCompanionInput(e.target.value)}
                  onKeyDown={handleNewCompanionKeyDown}
                  placeholder="Nome do acompanhante..."
                  className="flex-1"
                />
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="newComandaCompanionIsChild"
                    checked={newCompanionIsChild}
                    onCheckedChange={(checked) => setNewCompanionIsChild(checked === true)}
                  />
                  <label htmlFor="newComandaCompanionIsChild" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                    <Baby className="h-3 w-3" />
                    Criança
                  </label>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAddNewCompanion}
                  disabled={!newCompanionInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {balcaoTable && (
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-1"
                onClick={() => handleCreateNewComanda(balcaoTable.id)}
                disabled={!newComandaClientName.trim()}
              >
                <Coffee className="h-6 w-6 text-primary" />
                <span className="font-semibold">Sem Mesa (Balcão)</span>
                <span className="text-xs text-muted-foreground">Cliente avulso</span>
              </Button>
            )}
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Ou escolha uma mesa:</Label>
              <div className="grid grid-cols-4 gap-2">
                {tables.map(table => (
                  <Button
                    key={table.id}
                    variant="outline"
                    className="h-auto py-3 flex flex-col"
                    onClick={() => handleCreateNewComanda(table.id)}
                    disabled={!newComandaClientName.trim()}
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
              {comandaToClose && comandaToClose.remaining_total > 0 ? (
                <>
                  A comanda de <strong>{comandaToClose?.client_name}</strong> tem saldo pendente de 
                  R$ {comandaToClose?.remaining_total.toFixed(2)} (de R$ {comandaToClose?.total.toFixed(2)} total). Deseja fechar mesmo assim?
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
            {comandaToClose && comandaToClose.remaining_total > 0 && (
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
              {comandaToClose && comandaToClose.remaining_total > 0 ? 'Fechar sem Pagar' : 'Fechar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Atendimento;
