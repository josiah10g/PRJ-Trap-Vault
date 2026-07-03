"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("trap_vault_cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        requestAnimationFrame(() => setCart(parsed));
      } catch (e) {
        console.error("Error loading cart", e);
      }
    }
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("trap_vault_cart", JSON.stringify(newCart));
  };

  const addToCart = (product, size) => {
    const existingIndex = cart.findIndex(
      item => item.id === product.id && item.size === size
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      saveCart(newCart);
    } else {
      saveCart([...cart, { ...product, size, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, size, change) => {
    const newCart = cart.map(item => {
      if (item.id === productId && item.size === size) {
        const newQty = item.quantity + change;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    });
    saveCart(newCart);
  };

  const removeFromCart = (productId, size) => {
    saveCart(cart.filter(item => !(item.id === productId && item.size === size)));
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      getSubtotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
