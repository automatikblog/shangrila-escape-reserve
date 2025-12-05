import React, { createContext, useContext, useState, useCallback } from 'react';
import { MenuItem, parsePrice } from '@/lib/menuData';

export interface CartItem extends MenuItem {
  quantity: number;
  cartId: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  notes: string;
  setNotes: (notes: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');

  const addItem = useCallback((item: MenuItem) => {
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
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setItems(prev => prev.filter(i => i.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartId);
      return;
    }
    setItems(prev => prev.map(i =>
      i.cartId === cartId ? { ...i, quantity } : i
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setNotes('');
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
      setNotes
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
