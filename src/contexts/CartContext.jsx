// src/contexts/CartContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Rehydrate state from localStorage if available
    const storedCart = localStorage.getItem("cartItems");
    return storedCart ? JSON.parse(storedCart) : [];
  });

  useEffect(() => {
    // Persist cart state in localStorage whenever it changes
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (test) => {
    // Check if the test is already in the cart
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

  // Debug: show what's in memory and storage immediately after
  setTimeout(() => {
    console.log("🛒 After clearCart:");
    console.log("  - cartItems (state):", cartItems);
    console.log("  - localStorage:", localStorage.getItem("cartItems"));
  }, 200);
};




  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
