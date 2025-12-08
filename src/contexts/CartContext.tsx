import React, { createContext, useContext, useState, useCallback } from 'react';
import { MenuItem, parsePrice } from '@/lib/menuData';
import { toast } from 'sonner';

export interface CartItem extends MenuItem {
  quantity: number;
  cartId: string;
}

export type DeliveryType = 'mesa' | 'balcao' | null;

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => boolean;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => boolean;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  notes: string;
  setNotes: (notes: string) => void;
  canAddMore: (item: MenuItem) => boolean;
  deliveryType: DeliveryType;
  setDeliveryType: (type: DeliveryType) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(null);

  const canAddMore = useCallback((item: MenuItem): boolean => {
    return true; // Stock is informational only, no limits
  }, []);

  const addItem = useCallback((item: MenuItem): boolean => {
    setItems(prev => {
      const existingItem = prev.find(i => i.name === item.name && i.category === item.category);
      if (existingItem) {
        return prev.map(i =>
          i.cartId === existingItem.cartId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1, cartId: `${item.name}-${Date.now()}` }];
    });
    return true;
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setItems(prev => prev.filter(i => i.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId: string, quantity: number): boolean => {
    if (quantity <= 0) {
      removeItem(cartId);
      return true;
    }
    
    setItems(prev => prev.map(i =>
      i.cartId === cartId ? { ...i, quantity } : i
    ));
    return true;
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setNotes('');
    setDeliveryType(null);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => {
    const price = parsePrice(item.price);
    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      notes,
      setNotes,
      canAddMore,
      deliveryType,
      setDeliveryType
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
