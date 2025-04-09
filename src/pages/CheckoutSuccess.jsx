// src/pages/CheckoutSuccess.jsx
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          Payment Successful!
        </h1>
        {sessionId ? (
          <p className="text-lg text-gray-700 mb-2">
            Your session ID: <span className="font-mono">{sessionId}</span>
          </p>
        ) : (
          <p className="text-lg text-gray-700 mb-2">
            Your payment was processed successfully.
          </p>
        )}
        <p className="text-gray-600">
          Thank you for your purchase. You can now access your tests.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
