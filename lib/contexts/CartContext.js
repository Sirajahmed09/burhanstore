'use client';

import { cartLineKey, cartProduct } from '@/lib/commerce/colourVariants';
import { addCartLine, updateCartLine } from '@/lib/commerce/cartLines';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let savedCart = null;
      try { savedCart = localStorage.getItem('burhan-cart'); } catch {}
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) setCart(parsed.filter(item => item && item._id && Number.isSafeInteger(item.quantity) && item.quantity > 0 && Number.isFinite(Number(item.price))).map(item => { try { return { ...cartProduct(item), quantity: item.quantity }; } catch { return { ...item, cartKey: cartLineKey(item) }; } }));
        } catch (error) {
          console.error('Failed to parse cart from localStorage:', error);
          try { localStorage.removeItem('burhan-cart'); } catch {}
        }
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try { localStorage.setItem('burhan-cart', JSON.stringify(cart)); } catch {}
    }
  }, [cart, isLoaded]);

  const replaceCart = useCallback(items => setCart(items), []);

  const addToCart = (product, quantity = 1) => setCart(previous => addCartLine(previous, product, quantity));

  const removeFromCart = key => setCart(previous => previous.filter(item => cartLineKey(item) !== key));

  const updateQuantity = (key, quantity) => setCart(previous => updateCartLine(previous, key, quantity));

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoaded,
        replaceCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
