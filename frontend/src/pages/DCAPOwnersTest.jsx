import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

const DCAPOwnersTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL; // Ensure this is set in .env.local

  // Handle file selection via Drag & Drop
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  // Setup dropzone with noClick and noKeyboard so default events won't trigger the file picker
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
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
        console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/dcap_owners`);
        console.log("📂 File Selected:", file.name);
        const response = await axios.post(`${API_URL}/upload-csv/dcap_owners`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("✅ API Response:", response.data);
        // Append file-specific results, using the exact keys returned by the backend.
        uploadedResults.push({ fileName: file.name, data: response.data.Result });
      } catch (err) {
        console.error("❌ Upload error:", err.response ? err.response.data : err.message);
        setError("❌ Failed to upload file. Please check the format and try again.");
      }
    }

    setResults(uploadedResults);
    setLoading(false);
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
    // Outer container is made focusable (tabIndex="0") so it receives key events.
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload DCAP Owners Test File
      </h2>

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
            ✅ DCAP Owners Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Average DCAP Benefits for Owners:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {result["Average DCAP Benefits for Owners"] !== undefined
                  ? result["Average DCAP Benefits for Owners"]
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
          </div>
        </div>
      )
    </div>
  );
};

export default DCAPOwnersTest;
