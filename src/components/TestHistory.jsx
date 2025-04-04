import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  ref,
  getDownloadURL,
  listAll,
  getMetadata,
  deleteObject,
} from "firebase/storage";
import { storage } from "../firebase";
import { toast } from "react-toastify";
import { Filter } from "lucide-react";

const TestHistory = () => {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [showFilterBox, setShowFilterBox] = useState(false);

  useEffect(() => {
    const fetchTestsFromStorage = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

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
            let aiReviewed = "false";

            try {
              const resultPdfRef = ref(storage, `${basePath}/${folderName}/result.pdf`);
              const metadata = await getMetadata(resultPdfRef);
              pdfUrl = await getDownloadURL(resultPdfRef);

              if (metadata.customMetadata) {
                planYear = metadata.customMetadata["planYear"] || "N/A";
                testResult = metadata.customMetadata["testResult"] || "Unknown";
                aiReviewed = metadata.customMetadata["aiReviewed"] || "false";
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
              aiReviewed,
            };
          })
        );

        testData.sort((a, b) => b.timestamp - a.timestamp);
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

  useEffect(() => {
    const query = searchQuery.toLowerCase();

    const filtered = tests.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(query) ||
        t.year.toString().includes(query);

      const matchType = filterType === "all" ? true : t.name === filterType;
      const matchYear = filterYear === "all" ? true : t.year === filterYear;
      const matchResult =
        filterResult === "all"
          ? true
          : filterResult === "pass"
          ? t.result === "Passed"
          : t.result === "Failed";

      return matchSearch && matchType && matchYear && matchResult;
    });

    setFilteredTests(filtered);
  }, [tests, searchQuery, filterType, filterYear, filterResult]);

  const handleDeleteTest = async (folderId) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const confirm = window.confirm("Are you sure you want to delete this test?");
    if (!confirm) return;

    try {
      const basePath = `users/${user.uid}/pdfResults/${folderId}`;
      const resultRef = ref(storage, `${basePath}/result.pdf`);

      await deleteObject(resultRef);

      setTests((prev) => prev.filter((t) => t.id !== folderId));
      toast.success("Test deleted successfully.");
    } catch (err) {
      console.error("❌ Failed to delete test:", err);
      toast.error("Failed to delete test.");
    }
  };

  const uniqueYears = [...new Set(tests.map((t) => t.year))].sort();
  const uniqueTestNames = [...new Set(tests.map((t) => t.name))].sort();

  return (
    <div className="w-full mt-10 px-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Test History</h2>

      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search by test name or year..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mr-4 px-4 py-2 border border-gray-300 rounded"
        />
        <button
  onClick={() => setShowFilterBox(!showFilterBox)}
  className="p-2 border border-gray-300 rounded hover:bg-gray-100"
>
  <Filter className="w-5 h-5 text-gray-600" />
</button>
      </div>

      {showFilterBox && (
  <div className="mb-4 p-4 border border-gray-300 rounded bg-gray-50 max-h-72 overflow-y-auto">
    <div className="flex flex-col md:flex-row gap-4">
      {/* Test Name Filter */}
      <div>
        <label className="block text-sm font-medium mb-1">Test Name</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="all">All</option>
          {uniqueTestNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Plan Year Filter */}
      <div>
        <label className="block text-sm font-medium mb-1">Plan Year</label>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="all">All</option>
          {uniqueYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Test Result Filter */}
      <div>
        <label className="block text-sm font-medium mb-1">Test Result</label>
        <select
          value={filterResult}
          onChange={(e) => setFilterResult(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="all">All</option>
          <option value="pass">Passed</option>
          <option value="fail">Failed</option>
        </select>
      </div>
    </div>
  </div>
)}


      {loading ? (
        <p>Loading test history...</p>
      ) : filteredTests.length === 0 ? (
        <p>No tests found.</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4 border-b">Test Name</th>
                <th className="py-2 px-4 border-b">Plan Year</th>
                <th className="py-2 px-4 border-b">Test Result</th>
                <th className="py-2 px-4 border-b">Date/Time</th>
                <th className="py-2 px-4 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test) => (
                <tr key={test.id}>
                  <td className="py-2 px-4 border-b">{test.name}</td>
                  <td className="py-2 px-4 border-b">{test.year}</td>
                  <td className={`py-2 px-4 border-b font-semibold ${test.result === "Passed" ? "text-green-600" : "text-red-600"}`}>{test.result}</td>
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
                  <td className="py-2 px-4 border-b space-x-6">
                    <a
                      href={test.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View PDF
                    </a>
                    {!test.name.includes("AI Reviewed") && (
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
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
