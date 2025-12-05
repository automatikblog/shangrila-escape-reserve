import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { useClientSession } from '@/hooks/useClientSession';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { menuSections, parsePrice } from '@/lib/menuData';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartDrawer } from '@/components/menu/CartDrawer';
import { ClientNameModal } from '@/components/menu/ClientNameModal';
import { OrderStatusView } from '@/components/menu/OrderStatusView';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  
  const { session, isLoading: sessionLoading, needsName, createSession } = useClientSession(tableId);
  const { createOrder, orders } = useRealtimeOrders();
  const { items, totalItems, clearCart, notes } = useCart();
  const { toast } = useToast();

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

  // Check for active order
  useEffect(() => {
    if (session && orders.length > 0) {
      const activeOrder = orders.find(
        o => o.client_session_id === session.id && 
        ['pending', 'preparing', 'ready'].includes(o.status)
      );
      if (activeOrder) {
        setCurrentOrderId(activeOrder.id);
      }
    }
  }, [session, orders]);

  const handleConfirmOrder = async () => {
    if (!session || !tableId || items.length === 0) return;

    setIsSubmitting(true);

    const orderItems = items.map(item => ({
      name: item.name,
      price: parsePrice(item.price),
      quantity: item.quantity,
      category: item.category
    }));

    const { data, error } = await createOrder(
      tableId,
      session.id,
      orderItems,
      notes
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
  if (tableLoading || sessionLoading) {
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

  const categories = menuSections.map(s => s.category);
  const uniqueCategories = [...new Set(categories)];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Name Modal */}
      <ClientNameModal
        open={needsName}
        onSubmit={createSession}
        tableName={table ? `Mesa ${table.number} - ${table.name}` : undefined}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoShangrila} alt="Shangri-La" className="h-10 object-contain" />
          </div>
          <div className="text-right">
            <p className="font-medium">Mesa {table?.number}</p>
            <p className="text-xs text-muted-foreground">{session?.client_name}</p>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <Tabs defaultValue={menuSections[0]?.category} className="w-full">
        <div className="sticky top-[73px] z-40 bg-background border-b border-border">
          <TabsList className="w-full h-auto p-2 overflow-x-auto flex justify-start gap-2 bg-transparent">
            {menuSections.map((section) => (
              <TabsTrigger 
                key={section.category} 
                value={section.category}
                className="whitespace-nowrap text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full"
              >
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {menuSections.map((section) => (
          <TabsContent key={section.category} value={section.category} className="p-4 mt-0">
            <h2 className="text-lg font-bold mb-4 text-foreground">{section.title}</h2>
            {section.note && (
              <p className="text-sm text-muted-foreground mb-4 italic">{section.note}</p>
            )}
            <div className="space-y-3">
              {section.items.map((item, idx) => (
                <MenuItemCard key={`${section.category}-${idx}`} item={item} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

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
