import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import CsvTemplateDownloader from "../components/CsvTemplateDownloader"; // Adjust path if needed
import { getAuth } from "firebase/auth"; // Firebase Auth

function AdpTest() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Pull backend URL from Vite .env or default
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

  // Handle file selection via Drag & Drop
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  // Setup react-dropzone
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv, .xlsx", // Supports both CSV and Excel
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // Upload file to /upload-csv/adp
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }

    // Basic client-side validation
    const validFileTypes = [".csv", ".xlsx"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!validFileTypes.includes(`.${fileExtension}`)) {
      setError("❌ Invalid file type. Please upload a CSV or Excel file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Prepare FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("selected_tests", "adp"); // Must match a key in TEST_COLUMN_REQUIREMENTS

    try {
      console.log("🚀 Uploading file to:", `${API_URL}/upload-csv/adp`);
      console.log("📂 File Selected:", file.name);

      // 1. Get Firebase token (assuming user is logged in)
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      // 2. Send POST request with Bearer token
      const response = await axios.post(`${API_URL}/upload-csv/adp`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Response received:", response.data);

      // If your backend returns { "Test Results": { "adp": {...} } },
      // we retrieve the ADP test results object:
      const adpResults = response.data?.["Test Results"]?.["adp"];
      if (!adpResults) {
        setError("❌ No ADP test results found in response.");
      } else {
        setResult(adpResults);
      }
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Allow pressing Enter to trigger upload
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload ADP Test File
      </h2>

      {/* CSV Template Download Link */}
      <div className="flex justify-center mb-6">
        <CsvTemplateDownloader />
      </div>

      {/* Drag & Drop Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p className="text-green-600 font-semibold">{file.name}</p>
        ) : isDragActive ? (
          <p className="text-blue-600">📂 Drop the file here...</p>
        ) : (
          <p className="text-gray-600">
            Drag & drop a <strong>CSV or Excel file</strong> here.
          </p>
        )}
      </div>

      {/* Choose File Button */}
      <button
        type="button"
        onClick={open}
        className="mt-4 w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
      >
        Choose File
      </button>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        className={`w-full mt-4 px-4 py-2 text-white rounded-md ${
          !file ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
        }`}
        disabled={!file || loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* Display Results */}
      {result && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h3 className="font-bold text-xl text-gray-700 flex items-center">
            ADP Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">HCE ADP:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {result["HCE ADP (%)"] !== undefined
                  ? result["HCE ADP (%)"] + "%"
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">NHCE ADP:</strong>{" "}
              <span className="font-semibold text-green-600">
                {result["NHCE ADP (%)"] !== undefined
                  ? result["NHCE ADP (%)"] + "%"
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Test Result:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-md font-bold ${
                  result["Test Result"] === "Passed" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}
              >
                {result["Test Result"] ?? "N/A"}
              </span>
            </p>

            {/* Display corrective actions if the test fails */}
            {result["Test Result"] === "Failed" && (
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Refund Excess Contributions to HCEs by March 15 to avoid penalties.</li>
                  <br />
                  <li>Make Additional Contributions to NHCEs via QNEC or QMAC.</li>
                  <br />
                  <li>Recharacterize Excess HCE Contributions as Employee Contributions.</li>
                </ul>
              </div>
            )}

            {/* Display consequences if the test fails */}
            {result["Test Result"] === "Failed" && (
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ Excess Contributions Must Be Refunded</li>
                  <br />
                  <li>❌ IRS Penalties and Compliance Risks</li>
                  <br />
                  <li>❌ Loss of Tax Benefits for HCEs</li>
                  <br />
                  <li>❌ Plan Disqualification Risk</li>
                  <br />
                  <li>❌ Employee Dissatisfaction & Legal Risks</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdpTest;
