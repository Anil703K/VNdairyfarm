import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "vn_dairy_cart";
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    if (!product) return;
    setCartItems((prev) => {
      const key = String(product._id || product.id);
      const existing = prev.find((item) => String(item._id || item.id) === key);
      if (existing) {
        return prev.map((item) =>
          String(item._id || item.id) === key
            ? { ...item, quantity: item.quantity + Number(quantity || 1) }
            : item
        );
      }
      return [...prev, { ...product, quantity: Number(quantity || 1) }];
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    const qty = Math.max(1, Number(quantity || 1));
    setCartItems((prev) =>
      prev.map((item) =>
        String(item._id || item.id) === String(productId) ? { ...item, quantity: qty } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) =>
      prev.filter((item) => String(item._id || item.id) !== String(productId))
    );
  };

  const clearCart = () => setCartItems([]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cartItems]
  );

  const value = {
    cartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
};
