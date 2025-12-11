import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMenuItems, categoryLabels } from '@/hooks/useMenuItems';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Minus, Trash2, ShoppingCart, User, MapPin, Store, Send, Search } from 'lucide-react';
import { toast } from 'sonner';

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
  
  const [tables, setTables] = useState<Table[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [clientName, setClientName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<'mesa' | 'balcao' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('id, number, name')
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
      toast.error('Erro ao carregar mesas');
    } finally {
      setLoadingTables(false);
    }
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

    setIsSubmitting(true);

    try {
      // Create a client session for this manual order
      const { data: session, error: sessionError } = await supabase
        .from('client_sessions')
        .insert({
          table_id: selectedTable.id,
          client_name: clientName.trim(),
          device_fingerprint: `manual-${Date.now()}` // Unique fingerprint for manual orders
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create the order
      const orderItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        menuItemId: item.menuItemId
      }));

      const { error: orderError } = await createOrder(
        selectedTable.id,
        session.id,
        orderItems,
        notes || undefined,
        deliveryType
      );

      if (orderError) throw new Error(orderError);

      toast.success('Pedido enviado para a cozinha!');
      
      // Reset form
      setCart([]);
      setNotes('');
      setDeliveryType(null);
      setClientName('');
      setSelectedTable(null);
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
            {/* Table Selection */}
            <div className="space-y-2">
              <Label>Selecione a Mesa</Label>
              <div className="grid grid-cols-4 gap-2">
                {tables.map(table => (
                  <Button
                    key={table.id}
                    variant={selectedTable?.id === table.id ? 'default' : 'outline'}
                    className="h-auto py-3 flex flex-col"
                    onClick={() => setSelectedTable(table)}
                  >
                    <span className="text-lg font-bold">{table.number}</span>
                    <span className="text-xs truncate w-full">{table.name}</span>
                  </Button>
                ))}
              </div>
              {tables.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma mesa ativa
                </p>
              )}
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="clientName"
                  placeholder="Digite o nome..."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="pl-10"
                />
              </div>
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
                  disabled={!selectedTable || !clientName.trim() || cart.length === 0 || !deliveryType || isSubmitting}
                  onClick={handleSubmitOrder}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Send className="h-5 w-5 mr-2" />
                  )}
                  Enviar Pedido
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Atendimento;
