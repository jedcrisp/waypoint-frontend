import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { ref, getDownloadURL, listAll, getMetadata } from "firebase/storage";
import { storage } from "../firebase"; // ✅ Firebase config

const TestHistory = () => {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestsFromStorage = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.warn("⚠️ No authenticated user.");
        return;
      }

      try {
        const basePath = `users/${user.uid}/pdfResults`;
        const baseRef = ref(storage, basePath);
        const folders = await listAll(baseRef);

        const testData = await Promise.all(
          folders.prefixes.map(async (folderRef) => {
            const folderName = folderRef.name;
            const fileNameParts = folderName.split("-");
            const testName = fileNameParts.slice(0, -1).join(" ");
            const timestamp = Number(fileNameParts.slice(-1)[0]);

            let pdfUrl = "";
            let planYear = "N/A";
            let testResult = "Unknown";

            try {
              const resultPdfRef = ref(storage, `${basePath}/${folderName}/result.pdf`);
              const metadata = await getMetadata(resultPdfRef);
              pdfUrl = await getDownloadURL(resultPdfRef);

              if (metadata.customMetadata) {
                planYear = metadata.customMetadata["planYear"] || "N/A";
                testResult = metadata.customMetadata["testResult"] || "Unknown";
              }
            } catch (err) {
              console.warn("⚠️ Could not retrieve PDF metadata or URL:", err);
            }

            return {
              id: folderName,
              name: testName,
              year: planYear,
              result: testResult,
              timestamp: new Date(timestamp),
              pdfUrl,
            };
          })
        );

        setTests(testData);
        setFilteredTests(testData);
        setLoading(false);
      } catch (err) {
        console.error("🔥 Error fetching test data from Storage:", err);
        setLoading(false);
      }
    };

    fetchTestsFromStorage();
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
                <th className="py-2 px-4 border-b">Date/Time</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test) => (
                <tr key={test.id}>
                  <td className="py-2 px-4 border-b">{test.name}</td>
                  <td className="py-2 px-4 border-b">{test.year}</td>
                  <td className={`py-2 px-4 border-b font-semibold ${test.result === "Passed" ? "text-green-600" : "text-red-600"}`}>
                    {test.result}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {test.timestamp instanceof Date && !isNaN(test.timestamp)
                      ? test.timestamp.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                          second: "numeric",
                        })
                      : "N/A"}
                  </td>
                  <td className="py-2 px-4 border-b space-x-2">
                    <a
                      href={test.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View PDF
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
