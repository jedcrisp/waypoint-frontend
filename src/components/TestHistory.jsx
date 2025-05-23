// src/components/TestHistory.jsx
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
import { Search, Filter } from "lucide-react";
import Modal from "../components/Modal";
import { saveDeletionConsent } from "../utils/firebaseTestSaver";


const TestHistory = () => {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [showFilterBox, setShowFilterBox] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [signature, setSignature] = useState("");

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
        console.error("🔥 Error fetching test data:", err);
        setLoading(false);
      }
    };

    fetchTestsFromStorage();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = tests.filter((t) => {
      const matchSearch = t.name.toLowerCase().includes(query) || t.year.toString().includes(query);
      const matchType = filterType === "all" || t.name === filterType;
      const matchYear = filterYear === "all" || t.year === filterYear;
      const matchResult =
        filterResult === "all" ||
        (filterResult === "pass" && t.result === "Passed") ||
        (filterResult === "fail" && t.result === "Failed");
      return matchSearch && matchType && matchYear && matchResult;
    });
    setFilteredTests(filtered);
  }, [tests, searchQuery, filterType, filterYear, filterResult]);

  const handleDeleteClick = (testId) => {
    setSelectedTestId(testId);
    setShowDeleteModal(true);
  };

  const confirmDeleteTest = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !signature.trim()) return;

    try {
      const basePath = `users/${user.uid}/pdfResults/${selectedTestId}`;
      const resultRef = ref(storage, `${basePath}/result.pdf`);

      await deleteObject(resultRef);

      await saveDeletionConsent({
        testId: selectedTestId,
        signature,
      });

      toast.success("✅ Test deleted and deletion consent saved.");
      setTests((prev) => prev.filter((t) => t.id !== selectedTestId));
    } catch (err) {
      console.error("❌ Error deleting file or saving consent:", err);
      toast.error("Error deleting file.");
    } finally {
      setShowDeleteModal(false);
      setSelectedTestId(null);
    }
  };

  const uniqueYears = [...new Set(tests.map((t) => t.year))].sort();
  const uniqueTestNames = [...new Set(tests.map((t) => t.name))].sort();

  return (
  <div className="w-full mt-10 px-6 bg-white rounded shadow">
    <h2 className="text-2xl font-bold mb-4">Test History</h2>


    <div className="flex items-center mb-4">
  {/* Search input with icon inside a container */}
  <div className="relative w-full max-w-md">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
    <input
      type="text"
      placeholder="Search ..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded"
    />
  </div>

  {/* Filter icon on the right */}
  <button
    onClick={() => setShowFilterBox(!showFilterBox)}
    className="ml-2 p-2 border border-gray-300 rounded hover:bg-gray-100"
    title="Filter"
  >
    <Filter className="w-5 h-5 text-gray-600" />
  </button>
</div>

      {showFilterBox && (
  <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50 shadow">
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div className="flex flex-col md:flex-row gap-4">
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

      {/* ✅ Reset button aligned to right of filters */}
      <div>
        <button
          onClick={() => {
            setFilterType("all");
            setFilterYear("all");
            setFilterResult("all");
            setSearchQuery("");
          }}
          className="text-sm px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Reset Filters
        </button>
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
                  <td className="py-2 px-4 border-b">{test.timestamp.toLocaleString()}</td>
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
                        onClick={() => handleDeleteClick(test.id)}
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

      {showDeleteModal && (
        <Modal title="Confirm Deletion" onClose={() => setShowDeleteModal(false)}>
          <p className="text-gray-700 mb-4">
            Are you sure you want to permanently delete this test file?
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Digital Signature:</label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteTest}
              disabled={!signature.trim()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              Yes, Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TestHistory;
