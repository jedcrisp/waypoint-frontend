import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase"; // ✅ This uses your configured Firebase instance


const TestHistory = () => {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestHistory = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      const testCollection = collection(db, `users/${user.uid}/tests`);
      const testDocs = await getDocs(testCollection);

      const testData = await Promise.all(
        testDocs.docs.map(async (doc) => {
          const data = doc.data();

          const csvUrl = await getDownloadURL(ref(storage, data.csvPath));
          const pdfUrl = await getDownloadURL(ref(storage, data.pdfPath));

          return {
            id: doc.id,
            name: data.testName,
            year: data.planYear,
            result: data.testResult,
            csvUrl,
            pdfUrl,
          };
        })
      );

      setTests(testData);
      setFilteredTests(testData);
      setLoading(false);
    };

    fetchTestHistory();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredTests(
      tests.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.year.toString().includes(query)
      )
    );
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Test History</h2>

      <input
        type="text"
        placeholder="Search by test name or year..."
        value={searchQuery}
        onChange={handleSearch}
        className="w-full mb-4 px-4 py-2 border border-gray-300 rounded"
      />

      {loading ? (
        <p>Loading test history...</p>
      ) : filteredTests.length === 0 ? (
        <p>No tests found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4 border-b">Test Name</th>
                <th className="py-2 px-4 border-b">Plan Year</th>
                <th className="py-2 px-4 border-b">Test Result</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test) => (
                <tr key={test.id}>
                  <td className="py-2 px-4 border-b">{test.name}</td>
                  <td className="py-2 px-4 border-b">{test.year}</td>
                  <td
                    className={`py-2 px-4 border-b font-semibold ${
                      test.result === "Passed" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {test.result}
                  </td>
                  <td className="py-2 px-4 border-b space-x-2">
                    <a
                      href={test.csvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Download CSV
                    </a>
                    <a
                      href={test.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Download PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TestHistory;
