// src/contexts/CartContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Initial state: read from localStorage if available
  const [cartItems, setCartItems] = useState(() => {
    const storedCart = localStorage.getItem("cartItems");
    return storedCart ? JSON.parse(storedCart) : [];
  });

  // Rehydrate cart from localStorage only if the stored value is not empty ("[]")
  useEffect(() => {
    const storedCart = localStorage.getItem("cartItems");
    if (storedCart && storedCart !== "[]") {
      const parsedCart = JSON.parse(storedCart);
      if (parsedCart.length > 0) {
        setCartItems(parsedCart);
        console.log("🛒 Cart rehydrated from localStorage:", parsedCart);
      }
    } else {
      console.log("No cart items to rehydrate");
    }
  }, []);

  // Persist cart state to localStorage whenever it changes
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

    // Debug log: (state updates in React are asynchronous so this may log the old value)
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
