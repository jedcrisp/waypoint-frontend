import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import CsvTemplateDownloader from "../components/CsvTemplateDownloader"; // Adjust path as needed

const HealthFSA55AverageBenefitsTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv, .xlsx",
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }

    // Validate file type (CSV or Excel)
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
    // Ensure the backend matches this EXACT string
    formData.append("selected_tests", "health_fsa_55_average_benefits_test");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/health_fsa_55_average_benefits_test`);
      const response = await axios.post(
        `${API_URL}/upload-csv/health_fsa_55_average_benefits_test`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("✅ Full API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["health_fsa_55_average_benefits_test"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err);
      setError(err.response?.data?.error || "❌ Failed to upload file. Please check the format and try again.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload Health FSA 55% Average Benefits Test File
      </h2>

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

      {/* "Choose File" Button */}
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
          <h3 className="font-bold text-xl text-gray-700">Health FSA 55% Average Benefits Test Results</h3>
          <div className="mt-4">
            <p>
              <strong>Total Health FSA Benefits (Avg):</strong>{" "}
              {result?.["Total Health FSA Benefits (Avg)"] ?? "N/A"}
            </p>
            <p>
              <strong>NHCE Average Benefit:</strong>{" "}
              {result?.["NHCE Average Benefit"] ?? "N/A"}
            </p>
            <p>
              <strong>HCE Average Benefit:</strong>{" "}
              {result?.["HCE Average Benefit"] ?? "N/A"}
            </p>
            <p>
              <strong>Average Benefits Ratio (%):</strong>{" "}
              {result?.["Average Benefits Ratio (%)"] ?? "N/A"}%
            </p>
            <p>
              <strong>Test Result:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-md font-bold ${
                  result?.["Test Result"] === "Passed" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}
              >
                {result?.["Health_FSA_55_Average_Benefits_Test_Result"] ?? "N/A"}
              </span>
            </p>

            {/* Corrective Actions if Test Failed */}
            {result?.["Test Result"] === "Failed" && (
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>
                    Review and adjust contributions to ensure that the NHCE average benefit is at least 55% of the HCE average benefit.
                  </li>
                  <li>
                    Increase NHCE participation or modify the contribution formulas accordingly.
                  </li>
                  <li>
                    Reevaluate plan design to improve compliance with IRS requirements.
                  </li>
                </ul>
              </div>
            )}

            {/* Consequences if Test Failed */}
            {result?.["Test Result"] === "Failed" && (
              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ Potential reclassification of Health FSA benefits as taxable for HCEs.</li>
                  <li>❌ Increased IRS scrutiny and potential penalties.</li>
                  <li>❌ Additional employer contributions might be required to correct the imbalance.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthFSA55AverageBenefitsTest;
