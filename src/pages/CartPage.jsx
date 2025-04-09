// src/pages/CartPage.jsx
import React from "react";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { Trash2, ArrowLeft } from "lucide-react";
import CheckoutButton from "../components/CheckoutButton";
// Optional: if you have an authentication context, import it.
import { useAuth } from "../contexts/AuthContext";

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  // Retrieve the current user from your AuthContext (if available)
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.uid || "dummy_user_id";

  // Calculate total items and total price
  const totalItems = cartItems.length;
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  // Format price in dollars
  const formatPrice = (priceInCents) => `$${(priceInCents / 100).toFixed(2)}`;

  return (
    <div className="max-w-xl mx-auto mt-16 px-6 py-8 bg-white shadow-lg rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
      </div>

      {totalItems === 0 ? (
        <p className="text-gray-600 mb-6">
          Your cart is empty. Add some tests to proceed.
        </p>
      ) : (
        <>
          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-gray-50 rounded-md p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between mb-6 border-t pt-4">
            <p className="text-gray-600">
              Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
            </p>
            <p className="text-lg font-semibold text-gray-800">
              {formatPrice(totalPrice)}
            </p>
          </div>

          {/* Action Buttons */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* CheckoutButton handles session creation & Stripe redirection */}
              <CheckoutButton
                selectedTestItems={cartItems}
                userId={currentUserId}
              />
              <button
                onClick={clearCart}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-md shadow-md transition-colors"
              >
                Clear Cart
              </button>
            </div>
          )}
        </>
      )}

      {/* Back Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => navigate("/home")}
          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Test Catalog
        </button>
      </div>
    </div>
  );
}
