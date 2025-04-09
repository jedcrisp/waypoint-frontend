// src/pages/YourTests.jsx
import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";

export default function YourTests({ allTests }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [purchasedTests, setPurchasedTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPurchasedTests() {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPurchasedTests(data.purchasedTests || []);
        }
      } catch (error) {
        console.error("Error fetching purchased tests:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPurchasedTests();
  }, [currentUser]);

  // Filter the full list of tests to only those that the user purchased.
  const testsToShow = allTests.filter((test) => purchasedTests.includes(test.id));

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4 py-6 bg-white shadow rounded-lg border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Tests</h2>
      {testsToShow.length === 0 ? (
        <p className="text-gray-600 text-center">You haven't purchased any tests yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {testsToShow.map((test) => (
            <div key={test.id} className="p-4 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800">{test.name}</h3>
              <p className="text-gray-600 mt-2">{test.description}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => navigate("/home")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors"
        >
          Back to Test Catalog
        </button>
      </div>
    </div>
  );
}
