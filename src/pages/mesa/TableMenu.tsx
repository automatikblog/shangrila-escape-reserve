import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { useClientSession } from '@/hooks/useClientSession';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useMenuItems, categoryLabels } from '@/hooks/useMenuItems';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartDrawer } from '@/components/menu/CartDrawer';
import { ClientNameModal } from '@/components/menu/ClientNameModal';
import { OrderStatusView } from '@/components/menu/OrderStatusView';
import { ActiveOrdersList } from '@/components/menu/ActiveOrdersList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle 
} from '@/components/ui/drawer';
import { ShoppingCart, Loader2, AlertCircle, ChevronRight, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoShangrila from '@/assets/logo-shangrila.webp';

interface TableInfo {
  id: string;
  number: number;
  name: string;
  is_active: boolean;
}

const TableMenuContent: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [table, setTable] = useState<TableInfo | null>(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersDrawerOpen, setOrdersDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  
  const { session, isLoading: sessionLoading, needsName, createSession } = useClientSession(tableId);
  const { createOrder, orders } = useRealtimeOrders();
  const { items: menuItems, isLoading: menuLoading } = useMenuItems();
  const { items, totalItems, clearCart, notes, deliveryType } = useCart();
  const { toast } = useToast();

  // Filter active orders for current session
  const activeOrders = useMemo(() => {
    if (!session) return [];
    return orders.filter(
      o => o.client_session_id === session.id && 
      ['pending', 'preparing', 'ready'].includes(o.status)
    );
  }, [session, orders]);

  // Group available menu items by category
  const menuSections = useMemo(() => {
    const availableItems = menuItems.filter(item => item.is_available);
    const grouped: Record<string, typeof availableItems> = {};
    
    availableItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    return Object.entries(grouped).map(([category, items]) => ({
      category,
      title: categoryLabels[category] || category,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: `R$ ${item.price.toFixed(2).replace('.', ',')}`,
        description: item.description || undefined,
        category: item.category,
        isAvailable: item.is_available,
        stockQuantity: item.stock_quantity,
        // Bottle/dose fields
        productCode: item.product_code,
        isBottle: item.is_bottle,
        bottleMl: item.bottle_ml,
        doseMl: item.dose_ml,
        bottlesInStock: item.bottles_in_stock,
        currentBottleMl: item.current_bottle_ml
      }))
    }));
  }, [menuItems]);

  // Fetch table info
  useEffect(() => {
    const fetchTable = async () => {
      if (!tableId) {
        setTableError('Mesa não encontrada');
        setTableLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tables')
          .select('*')
          .eq('id', tableId)
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setTableError('Mesa não encontrada ou inativa');
        } else {
          setTable(data);
        }
      } catch (err) {
        console.error('Error fetching table:', err);
        setTableError('Erro ao carregar informações da mesa');
      } finally {
        setTableLoading(false);
      }
    };

    fetchTable();
  }, [tableId]);

  // Handle order selection from active orders list
  const handleSelectOrder = (orderId: string) => {
    setCurrentOrderId(orderId);
    setOrdersDrawerOpen(false);
  };

  const handleConfirmOrder = async () => {
    if (!session || !tableId || items.length === 0 || !deliveryType) return;

    setIsSubmitting(true);

    // Find menu item IDs for stock deduction
    const orderItems = items.map(item => {
      const menuItem = menuItems.find(mi => mi.name === item.name && mi.category === item.category);
      const price = parseFloat(item.price.replace('R$', '').replace(',', '.').trim());
      return {
        name: item.name,
        price: price,
        quantity: item.quantity,
        category: item.category,
        menuItemId: menuItem?.id
      };
    });

    const { data, error } = await createOrder(
      tableId,
      session.id,
      orderItems,
      notes,
      deliveryType
    );

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Erro ao enviar pedido',
        description: error,
        variant: 'destructive'
      });
    } else if (data) {
      setCurrentOrderId(data.id);
      clearCart();
      setCartOpen(false);
      toast({
        title: 'Pedido enviado!',
        description: 'Acompanhe o status do seu pedido.',
      });
    }
  };

  const handleNewOrder = () => {
    setCurrentOrderId(null);
  };

  // Loading states
  if (tableLoading || sessionLoading || menuLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (tableError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">{tableError}</h1>
        <p className="text-muted-foreground text-center">
          Verifique o QR Code e tente novamente.
        </p>
      </div>
    );
  }

  // Current order view
  const currentOrder = orders.find(o => o.id === currentOrderId);
  if (currentOrderId && currentOrder && ['pending', 'preparing', 'ready'].includes(currentOrder.status)) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border p-4">
          <div className="flex items-center justify-center gap-3">
            <img src={logoShangrila} alt="Shangri-La" className="h-10 object-contain" />
            <span className="text-muted-foreground">Mesa {table?.number}</span>
          </div>
        </header>
        <OrderStatusView order={currentOrder} onNewOrder={handleNewOrder} />
      </div>
    );
  }

  const defaultCategory = menuSections[0]?.category || '';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Name Modal */}
      <ClientNameModal
        open={needsName}
        onSubmit={createSession}
        tableName={table ? `Mesa ${table.number} - ${table.name}` : undefined}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img src={logoShangrila} alt="Shangri-La" className="h-10 object-contain" />
          </div>
          <div className="text-right">
            <p className="font-medium">Mesa {table?.number}</p>
            <p className="text-xs text-muted-foreground">{session?.client_name}</p>
          </div>
        </div>
        
        {/* Active Orders Banner */}
        {activeOrders.length > 0 && (
          <button
            onClick={() => setOrdersDrawerOpen(true)}
            className="w-full px-4 py-2 bg-primary/10 border-t border-primary/20 flex items-center justify-between hover:bg-primary/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {activeOrders.length === 1 
                  ? '1 pedido em andamento' 
                  : `${activeOrders.length} pedidos em andamento`}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-primary" />
          </button>
        )}
      </header>

      {/* Active Orders Drawer */}
      <Drawer open={ordersDrawerOpen} onOpenChange={setOrdersDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Seus Pedidos</DrawerTitle>
          </DrawerHeader>
          <ActiveOrdersList 
            orders={activeOrders} 
            onSelectOrder={handleSelectOrder} 
          />
        </DrawerContent>
      </Drawer>

      {/* Menu Content */}
      {menuSections.length === 0 ? (
        <div className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum item disponível no momento</p>
        </div>
      ) : (
        <Tabs defaultValue={defaultCategory} className="w-full">
          <div className="sticky top-[73px] z-40 bg-background border-b border-border relative">
            {/* Scroll hint gradient on the right */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none flex items-center justify-end pr-1">
              <div className="animate-pulse">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            
            <TabsList className="w-full h-auto p-2 pr-14 overflow-x-auto flex justify-start gap-2 bg-transparent scrollbar-hide">
              {menuSections.map((section) => (
                <TabsTrigger 
                  key={section.category} 
                  value={section.category}
                  className="whitespace-nowrap text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full shrink-0"
                >
                  {section.title}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Scroll hint text */}
            <p className="text-[10px] text-muted-foreground text-center pb-1 -mt-1">
              Deslize para ver mais categorias →
            </p>
          </div>

          {menuSections.map((section) => (
            <TabsContent key={section.category} value={section.category} className="p-4 mt-0">
              <h2 className="text-lg font-bold mb-4 text-foreground">{section.title}</h2>
              <div className="space-y-3">
                {section.items.map((item, idx) => (
                  <MenuItemCard key={`${section.category}-${idx}`} item={item} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Cart FAB */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Button 
            className="w-full h-14 text-lg shadow-lg"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Ver Pedido ({totalItems})
          </Button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        onConfirmOrder={handleConfirmOrder}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

const TableMenu: React.FC = () => {
  return (
    <CartProvider>
      <TableMenuContent />
    </CartProvider>
  );
};

export default TableMenu;
