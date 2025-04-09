import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { TEST_CATALOG } from "../data/testCatalog.js";

export default function YourTests() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [purchasedTests, setPurchasedTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchPurchasedTests = async () => {
      try {
        console.log("Reading from path:", `users/${currentUser.uid}/purchasedTests`);
        console.log("User ID from auth:", currentUser.uid);

        const purchasedRef = collection(db, `users/${currentUser.uid}/purchasedTests`);
        const snapshot = await getDocs(purchasedRef);

        const unlockedTests = snapshot.docs
          .filter((doc) => {
            const data = doc.data();
            return data.unlocked === true && data.used === false;
          })
          .map((doc) => doc.id);

        setPurchasedTests(unlockedTests);
      } catch (error) {
        console.error("❌ Error fetching purchased tests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedTests();
  }, [currentUser]);

  const testsToShow = TEST_CATALOG.filter((test) =>
    purchasedTests.includes(test.id)
  );

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4 py-6 bg-white shadow rounded-lg border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Tests</h2>

      {testsToShow.length === 0 ? (
        <p className="text-gray-600 text-center">
          You haven't purchased any tests yet, or they've already been used.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {testsToShow.map((test) => (
            <div key={test.id} className="p-4 border rounded-lg shadow-sm bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-800">{test.name}</h3>
              <p className="text-gray-600 mt-2">{test.description}</p>
              <button
                onClick={() => navigate(`/${test.id}`)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Run Test
              </button>
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
