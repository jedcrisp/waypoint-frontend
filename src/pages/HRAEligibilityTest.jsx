import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import CsvTemplateDownloader from "../components/CsvTemplateDownloader"; 

const HRAEligibilityTest = () => {
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

  // Setup dropzone with noClick and noKeyboard so default events don't trigger file picker
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
    formData.append("selected_tests", "hra_eligibility"); // Add the selected_tests parameter

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/hra_eligibility`);
      console.log("📂 File Selected:", file.name);
      const response = await axios.post(`${API_URL}/upload-csv/hra_eligibility`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("✅ API Response:", response.data);
      // Set the result directly from the API response.
      setResult(response.data.Result);
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    }
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
    // Outer container is focusable (tabIndex="0") so it receives key events.
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload HRA Eligibility Test File
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
            HRA Eligibility Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">HCE Eligibility:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {result["HCE Eligibility (%)"] !== undefined
                  ? result["HCE Eligibility (%)"]
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Non-HCE Eligibility:</strong>{" "}
              <span className="font-semibold text-green-600">
                {result["Non-HCE Eligibility (%)"] !== undefined
                  ? result["Non-HCE Eligibility (%)"]
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Ratio:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {result["Ratio (%)"] !== undefined
                  ? result["Ratio (%)"] + "%"
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Test Result:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-md font-bold ${
                  result["Test Result"] === "Passed"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
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
                  <li>Expand HRA Eligibility for NHCEs: Adjust plan rules to ensure more NHCEs qualify for HRA benefits.</li>
                  <br />
                  <li>Eliminate Discriminatory Requirements: Remove restrictions such as long waiting periods, minimum service requirements, or job classifications that limit NHCE participation.</li>
                  <br />
                  <li>Encourage NHCE Enrollment: Provide better education on HRA benefits, offer incentives, and streamline the enrollment process.</li>
                  <br />
                  <li>Amend the Plan Document: Update eligibility rules to comply with IRS nondiscrimination guidelines and apply fair access policies.</li>
                </ul>
              </div>
            )}

            {/* Display consequences if the test fails */}
            {result["Test Result"] === "Failed" && (
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ HCEs’ HRA benefits become taxable income instead of tax-free.</li>
                  <br />
                  <li>❌ IRS penalties and possible disqualification of the HRA plan.</li>
                  <br />
                  <li>❌ NHCE employees could lose access to tax-free HRA benefits.</li>
                  <br />
                  <li>❌ Legal and financial risks for failing IRS nondiscrimination testing</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAEligibilityTest;
