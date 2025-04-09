// src/components/ACPTestBlockedView.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Lock } from "lucide-react";

export default function ACPTestBlockedView({ addToCart, testId }) {
  const [cartMsg, setCartMsg] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const navigate = useNavigate();

  const handleAddToCart = () => {
    // Add test details to the cart using your CartContext
    addToCart({
      id: testId,
      name: "ACP Test",
      price: 25000, // Price in cents (e.g., $10.99)
      description: "ACP Test to evaluate contributions",
    });
    setCartMsg("ACP Test has been added to your cart");
    setAddedToCart(true);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-md rounded-lg border border-gray-200 text-center">
      <div className="flex justify-center mb-4">
        <Lock className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
      <p className="mb-4 text-gray-700">
        This test is locked. You must purchase access before you can run it.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
        <button
          onClick={handleAddToCart}
          className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-md w-full sm:w-auto"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add to Cart
        </button>
        <button
          onClick={() => navigate("/home")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-md w-full sm:w-auto"
        >
          Back to Test Catalog
        </button>
      </div>
      {cartMsg && (
        <p className="mt-4 text-green-600 font-medium">{cartMsg}</p>
      )}
      {addedToCart && (
        <div className="mt-6">
          <button
            onClick={() => navigate("/cart")}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-md"
          >
            Proceed to Cart
          </button>
        </div>
      )}
    </div>
  );
}
