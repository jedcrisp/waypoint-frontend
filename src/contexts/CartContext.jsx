// src/contexts/CartContext.jsx (simplified version)
import React, { createContext, useState, useEffect, useContext } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const storedCart = localStorage.getItem("cartItems");
    return storedCart ? JSON.parse(storedCart) : [];
  });

  // Persist cart state changes to localStorage
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
  // Use a function update to ensure we set state to empty array
  setCartItems(() => {
    const newCart = [];
    localStorage.setItem("cartItems", JSON.stringify(newCart));
    console.log("💾 localStorage after clearCart:", localStorage.getItem("cartItems"));
    return newCart;
  });
};


  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
