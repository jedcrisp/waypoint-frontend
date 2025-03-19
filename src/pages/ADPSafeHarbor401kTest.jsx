import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import CsvTemplateDownloader from "../components/CsvTemplateDownloader"; // Adjust path as needed

const ADPSafeHarbor401kTest = () => {
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

    // Validate file type (case-insensitive)
    const validFileTypes = ["csv", "xlsx"];
    const fileType = file.name.split('.').pop().toLowerCase();
    if (!validFileTypes.includes(fileType)) {
      setError("❌ Invalid file type. Please upload a CSV or Excel file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    // Set the test type to adp_safe_harbor_401k
    formData.append("selected_tests", "adp_safe_harbor_401k");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/adp_safe_harbor_401k`);
      console.log("📂 File Selected:", file.name);
      const response = await axios.post(`${API_URL}/upload-csv/adp_safe_harbor_401k`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("✅ Response received:", response.data);
      setResult(response.data["Test Results"]["adp_safe_harbor_401k"]);
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
        📂 Upload ADP Safe Harbor 401(k) Test File
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
            Safe Harbor 401(k) Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              {result["Total Employees"] ?? "N/A"}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligible Employees:</strong>{" "}
              {result["Eligible Employees"] ?? "N/A"}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligibility Percentage:</strong>{" "}
              {result["Eligibility Percentage (%)"] ?? "N/A"}%
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Average Employer Contribution:</strong>{" "}
              {result["Average Employer Contribution (%)"]
                ? result["Average Employer Contribution (%)"] + "%"
                : "N/A"}
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
                {result["ADP Safe Harbor 401 (k) Test Result"] ?? "N/A"}
              </span>
            </p>

             {/* Display corrective actions if the ADP Safe Harbor 401(k) Test fails */}
              {result["Test Result"] === "Failed" && (
                <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                  <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                  <ul className="list-disc list-inside text-black-600">
                    <li>Review and update employer contribution policies to meet Safe Harbor thresholds.</li>
                    <br />
                    <li>Increase employer contributions to achieve a minimum of 3% non-elective or the enhanced match.</li>
                    <br />
                    <li>Adjust plan eligibility criteria to ensure broad employee participation.</li>
                  </ul>
                </div>
              )}

                {/* Display consequences if the ADP Safe Harbor 401(k) Test fails */}
                {result["Test Result"] === "Failed" && (
                  <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                    <h4 className="font-bold text-black-600">Consequences:</h4>
                    <ul className="list-disc list-inside text-black-600">
                    <li>❌ Loss of Safe Harbor exemption, requiring full ADP/ACP testing.</li>
                    <br />
                    <li>❌ Potential IRS penalties and increased audit risk.</li>
                    <br />
                    <li>❌ Additional administrative burden and corrective contributions.</li>
                    <br />
                    <li>❌ Negative impact on plan competitiveness and employee satisfaction.</li>
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

export default ADPSafeHarbor401kTest;
