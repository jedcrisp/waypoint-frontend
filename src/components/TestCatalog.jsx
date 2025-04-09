import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Lock } from "lucide-react";
import testCatalog from "../data/testCatalog";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutButton = ({ selectedTests, userId, testsData }) => {
  const handleCheckout = async () => {
    try {
      const selectedTestItems = testsData.filter((test) =>
        selectedTests.includes(test.id)
      );
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(
        `${backendUrl}/api/create-checkout-session`,
        {
          testItems: selectedTestItems,
          userId,
        }
      );
      const sessionId = response.data.id;
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) console.error("Stripe redirect error:", error);
    } catch (error) {
      console.error("Error in checkout process:", error);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      Proceed to Checkout ({selectedTests.length} selected)
    </button>
  );
};

const TestCatalog = ({ userId, purchasedTests }) => {
  const navigate = useNavigate();
  const tests = testCatalog;
  const [selectedTests, setSelectedTests] = useState([]);

  const toggleTestSelection = (testId) => {
    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Available Tests</h2>
      <div className="grid grid-cols-1 gap-4">
        {tests.map((test) => {
          const isPurchased = purchasedTests.includes(test.id);
          return (
            <div
              key={test.id}
              className="relative border p-4 rounded shadow flex flex-col justify-between"
            >
              {!isPurchased && (
                <div className="absolute inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-10">
                  <Lock className="w-8 h-8 text-gray-600" />
                  <span className="ml-2 text-gray-600 font-bold">Locked</span>
                </div>
              )}
              <div className={isPurchased ? "" : "opacity-50"}>
                <h3 className="font-bold text-lg">{test.name}</h3>
                <p className="text-gray-600">{test.description}</p>
                <p className="text-sm mt-1">
                  Price: ${(test.price / 100).toFixed(2)}
                </p>
              </div>
              <div className="mt-4 z-20 relative">
                {isPurchased ? (
                  <button
                    onClick={() => navigate(`/dashboard/tests/${test.id}`)}
                    className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Run Test
                  </button>
                ) : (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(test.id)}
                      onChange={() => toggleTestSelection(test.id)}
                      className="mr-2"
                    />
                    Add to Cart
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selectedTests.length > 0 && (
        <div className="mt-4">
          <CheckoutButton
            selectedTests={selectedTests}
            userId={userId}
            testsData={tests}
          />
        </div>
      )}
    </div>
  );
};

export default TestCatalog;
