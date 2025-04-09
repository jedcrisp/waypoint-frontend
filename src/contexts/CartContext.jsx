// src/contexts/CartContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const storedCart = localStorage.getItem("cartItems");
    return storedCart ? JSON.parse(storedCart) : [];
  });

  // ✅ Rehydrate cart from localStorage unless skip flag is set
  useEffect(() => {
    const skip = sessionStorage.getItem("skipCartRehydration");
    if (skip === "true") {
      sessionStorage.removeItem("skipCartRehydration"); // clear the flag
      console.log("🚫 Skipping cart rehydration after checkout");
      return;
    }

    const storedCart = localStorage.getItem("cartItems");
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];

    if (parsedCart.length > 0) {
      setCartItems(parsedCart);
      console.log("🛒 Cart rehydrated from localStorage:", parsedCart);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
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
    sessionStorage.setItem("skipCartRehydration", "true");

    setTimeout(() => {
      console.log("🛒 After clearCart:");
      console.log("  - cartItems (state):", cartItems);
      console.log("  - localStorage:", localStorage.getItem("cartItems"));
    }, 200);
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
