// src/contexts/CartContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // If we’re returning from checkout (Stripe redirect typically includes session_id),
    // ignore any stored cart and start with an empty array.
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_id")) {
      return [];
    }

    // Otherwise, initialize from localStorage as usual.
    const storedCart = localStorage.getItem("cartItems");
    return storedCart ? JSON.parse(storedCart) : [];
  });

  // Whenever cartItems changes, persist it to localStorage.
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    console.log("💾 Updated localStorage with cartItems:", cartItems);
  }, [cartItems]);

  const addToCart = (test) => {
    if (!cartItems.find((item) => item.id === test.id)) {
      setCartItems((prev) => [...prev, test]);
    }
  };

  const removeFromCart = (testId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== testId));
  };

  const clearCart = () => {
    console.log("🧹 clearCart() called");
    setCartItems([]);
    localStorage.setItem("cartItems", JSON.stringify([]));
    console.log("💾 localStorage after clearCart:", localStorage.getItem("cartItems"));
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
