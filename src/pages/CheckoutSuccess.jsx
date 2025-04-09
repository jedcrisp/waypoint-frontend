import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuth } from "firebase/auth";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const confirmPurchase = async () => {
      if (!sessionId) {
        setError("Missing session ID");
        setLoading(false);
        return;
      }

      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          setError("User not authenticated.");
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();

        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/stripe/confirm`,
          { session_id: sessionId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setLoading(false);

        // Redirect to dashboard after a short delay
        setTimeout(() => navigate("/dashboard"), 2000);
      } catch (err) {
        console.error("Error confirming purchase:", err);
        setError("Something went wrong while confirming your purchase.");
        setLoading(false);
      }
    };

    confirmPurchase();
  }, [sessionId, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {loading ? (
          <>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Finalizing your purchase...
            </h1>
            <p className="text-gray-600">
              Please wait while we confirm your test access.
            </p>
          </>
        ) : error ? (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Uh-oh!
            </h1>
            <p className="text-gray-700 mb-2">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow"
            >
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-green-600 mb-4">
              Payment Successful!
            </h1>
            <p className="text-gray-700">
              Thank you for your purchase. Redirecting you to your dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
