// src/hooks/useTests.js
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // adjust the path if needed

export function useTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
      try {
        const testsCollection = collection(db, "tests");
        const testsSnapshot = await getDocs(testsCollection);
        // Map each document to an object with its id and data
        const testsList = testsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTests(testsList);
      } catch (error) {
        console.error("Error fetching tests:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, []);

  return { tests, loading };
}
