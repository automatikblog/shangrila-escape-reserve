import React, { useState, useEffect } from 'react';
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
import { Loader2, Plus, Minus, Trash2, ShoppingCart, User, MapPin, Store, Send } from 'lucide-react';
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
    setCart(cart.map(item => {
      if (item.id === cartItemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
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

  // Group menu items by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Table & Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Mesa e Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Table Selection */}
            <div className="space-y-2">
              <Label>Selecione a Mesa</Label>
              <div className="grid grid-cols-3 gap-2">
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
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="mesa" id="mesa" />
                  <Label htmlFor="mesa" className="flex items-center gap-2 cursor-pointer flex-1">
                    <MapPin className="h-4 w-4" />
                    Entregar na mesa
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="balcao" id="balcao" />
                  <Label htmlFor="balcao" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Store className="h-4 w-4" />
                    Retirar no balcão
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

        {/* Middle Column - Menu Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Itens do Cardápio</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-4">
                {Object.entries(itemsByCategory).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                      {categoryLabels[category] || category}
                    </h3>
                    <div className="space-y-2">
                      {items.map(item => {
                        const cartItem = cart.find(c => c.menuItemId === item.id);
                        const isUnavailable = item.stock_quantity === 0;
                        
                        return (
                          <div 
                            key={item.id}
                            className={`flex items-center justify-between p-2 rounded-lg border ${
                              isUnavailable ? 'opacity-50 bg-muted' : 'hover:bg-accent/30'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-sm text-primary font-semibold">
                                R$ {item.price.toFixed(2)}
                              </p>
                            </div>
                            {isUnavailable ? (
                              <Badge variant="secondary" className="text-xs">Esgotado</Badge>
                            ) : cartItem ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(cartItem.id, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-medium">
                                  {cartItem.quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(cartItem.id, 1)}
                                >
                                  <Plus className="h-3 w-3" />
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
          </CardContent>
        </Card>

        {/* Right Column - Cart Summary */}
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
          <CardContent className="space-y-4">
            {selectedTable && (
              <div className="p-3 bg-accent/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Mesa</p>
                <p className="font-semibold">{selectedTable.number} - {selectedTable.name}</p>
              </div>
            )}
            
            {clientName && (
              <div className="p-3 bg-accent/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-semibold">{clientName}</p>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Carrinho vazio</p>
                <p className="text-sm">Adicione itens do cardápio</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity}x R$ {item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </span>
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
                </ScrollArea>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedTable || !clientName.trim() || cart.length === 0 || !deliveryType || isSubmitting}
              onClick={handleSubmitOrder}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              Enviar Pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Atendimento;
