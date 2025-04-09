// src/components/CheckoutButton.jsx
import React from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";

// Ensure the environment variable is properly set in your .env file as VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutButton = ({ selectedTestItems = [], userId }) => {
  // Now selectedTestItems is guaranteed to be an array
  const handleCheckout = async () => {
    console.log("🟢 Proceed to Checkout clicked");
    console.log("🧪 selectedTestItems:", selectedTestItems);
    console.log("👤 Sending userId to backend:", userId);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(`${backendUrl}/api/create-checkout-session`, {
        testItems: selectedTestItems,
        userId,
      });
      const sessionId = response.data.id;
      if (!sessionId) {
        console.error("No session ID returned from backend");
        return;
      }
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error("Stripe redirect error:", error);
      }
    } catch (error) {
      console.error("Error in checkout process:", error);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      Proceed to Checkout ({selectedTestItems.length} selected)
    </button>
  );
};


export default CheckoutButton;
