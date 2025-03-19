import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import CsvTemplateDownloader from "../components/CsvTemplateDownloader"; // Adjust the path as needed

const ADPSafeHarborSlidingTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL; // Ensure this is set in your environment

  // Handle file selection via drag & drop or manual selection
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv, .xlsx", // Supports CSV and Excel files
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

    // Validate file type (case insensitive)
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
    // Set the test type to "adp_safe_harbor_sliding"
    formData.append("selected_tests", "adp_safe_harbor_sliding");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/adp_safe_harbor_sliding`);
      console.log("📂 File Selected:", file.name);
      const response = await axios.post(`${API_URL}/upload-csv/adp_safe_harbor_sliding`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("✅ Response received:", response.data);
      // Assume the API returns the results under "Test Results" with key "adp_safe_harbor_sliding"
      setResult(response.data["Test Results"]["adp_safe_harbor_sliding"]);
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err);
      setError("❌ Failed to upload file. Please check the format and try again.");
    }
    setLoading(false);
  };

  // Trigger upload on Enter key press
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
        📂 Upload ADP Safe Harbor Sliding Scale Test File
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
            ADP Safe Harbor Sliding Scale Test Results
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
              <strong className="text-gray-700">IRS Safe Harbor Limit:</strong>{" "}
              <span className="font-semibold text-purple-600">
                {result["IRS Safe Harbor Limit"] !== undefined
                  ? result["IRS Safe Harbor Limit"] + "%"
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

            {/* Display corrective actions if the ADP Safe Harbor Sliding Test fails */}
            {result["Test Result"] === "Failed" && (
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>
                    Reassess employee deferral strategies to bring HCE deferral percentages within the sliding scale limits.
                  </li>
                  <br />
                  <li>
                    Implement targeted communication and education to encourage appropriate deferral behavior among HCEs.
                  </li>
                  <br />
                  <li>
                    Consider revising plan design to achieve a more balanced deferral pattern between HCEs and NHCEs.
                  </li>
                </ul>
              </div>
            )}

            {/* Display consequences if the ADP Safe Harbor Sliding Test fails */}
            {result["Test Result"] === "Failed" && (
              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>
                    ❌ Failure to meet sliding scale limits may trigger additional corrective contributions.
                  </li>
                  <br />
                  <li>
                    ❌ Increased administrative burden to manage non-compliance and subsequent testing.
                  </li>
                  <br />
                  <li>
                    ❌ Potential IRS penalties and scrutiny if corrective measures are not implemented.
                  </li>
                  <br />
                  <li>
                    ❌ Negative impact on overall plan fairness and employee satisfaction.
                  </li>
                </ul>
              </div>
            )}

            {/* Optionally display additional breakdown details */}
            {result["Breakdown"] && (
              <div className="mt-4">
                <pre className="bg-gray-100 p-3 rounded text-sm">
                  {JSON.stringify(result["Breakdown"], null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ADPSafeHarborSlidingTest;
