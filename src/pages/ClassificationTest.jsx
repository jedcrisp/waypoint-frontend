import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import CsvTemplateDownloader from "../components/CsvTemplateDownloader"; // Adjust the path as needed
import { getAuth } from "firebase/auth"; // Import Firebase Auth

const ClassificationTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL; // Ensure this is the correct URL for your backend

  // Handle file selection via Drag & Drop or manual selection
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  // Setup dropzone with noClick and noKeyboard to prevent default events from opening the file picker
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv, .xlsx",
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }

    // Validate file type
    const validFileTypes = ["csv", "xlsx"];
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!validFileTypes.includes(fileType)) {
      setError("❌ Invalid file type. Please upload a CSV or Excel file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("selected_tests", "classification");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/classification`);
      console.log("📂 File Selected:", file.name);

      // 1. Get Firebase token
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      console.log("Firebase Token:", token);

      // 2. Send POST request with Bearer token
      const response = await axios.post(`${API_URL}/upload-csv/classification`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ API Response:", response.data);
      setResult(response.data["Test Results"]["classification"]);
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Listen for Enter key press to trigger upload
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
        📂 Upload Classification Test File
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

      {/* Dedicated "Choose File" Button */}
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
            Classification Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {result["Total Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligible for Cafeteria Plan:</strong>{" "}
              <span className="font-semibold text-green-600">
                {result["Eligible for Cafeteria Plan"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligibility Percentage (%):</strong>{" "}
              <span className="font-semibold text-blue-600">
                {result["Eligibility Percentage (%)"] !== undefined
                  ? result["Eligibility Percentage (%)"] + "%"
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
                  <li>Review and verify employee classifications.</li>
                  <br />
                  <li>Recalculate benefit allocations to ensure compliance.</li>
                  <br />
                  <li>Amend plan documents to clarify classification rules.</li>
                  <br />
                  <li>Consult with legal or tax advisors for corrections.</li>
                </ul>
              </div>
            )}

            {/* Display consequences if the test fails */}
            {result["Test Result"] === "Failed" && (
              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ Loss of tax-exempt status for key employees.</li>
                  <br />
                  <li>❌ IRS compliance violations and penalties.</li>
                  <br />
                  <li>❌ Plan disqualification risks.</li>
                  <br />
                  <li>❌ Employee dissatisfaction and legal risks.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassificationTest;
