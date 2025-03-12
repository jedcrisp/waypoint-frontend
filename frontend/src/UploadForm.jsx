import { useState } from "react";
import axios from "axios";
import { UploadCloud, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  // Handle file selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setResult(null);
    setError(null);
  };

  // Drag & Drop Functionality
  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) {
      setFile(event.dataTransfer.files[0]);
      setResult(null);
      setError(null);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ API Response:", response.data); // Debugging
      setResult(response.data);
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">📂 Upload ADP Test File</h2>

      <div
        className={`border-2 ${
          dragging ? "border-blue-500 bg-blue-100" : "border-gray-300"
        } border-dashed rounded-lg p-6 text-center cursor-pointer`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-gray-600">Drag & Drop your CSV file here</p>
        <p className="text-sm text-gray-400">or</p>
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          id="fileUpload"
        />
        <label
          htmlFor="fileUpload"
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 cursor-pointer"
        >
          Select File
        </label>
      </div>

      {file && (
        <p className="mt-3 text-gray-700 text-center">
          📄 Selected File: <span className="font-semibold">{file.name}</span>
        </p>
      )}

      <button
        onClick={handleUpload}
        className={`w-full mt-4 px-4 py-2 text-white rounded-md ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
        }`}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {error && <p className="mt-3 text-red-500 text-center">{error}</p>}

      {result && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h3 className="font-bold text-lg text-gray-700">✅ ADP Test Results:</h3>
          <div className="mt-2 space-y-2">
            <p>
              <strong>HCE Avg Deferral:</strong>{" "}
              <span className="text-blue-700">
                {result["HCE_Average_Deferral (%)"] ?? "0.00"}%
              </span>
            </p>
            <p>
              <strong>NHCE Avg Deferral:</strong>{" "}
              <span className="text-green-700">
                {result["NHCE_Average_Deferral (%)"] ?? "0.00"}%
              </span>
            </p>
            <p
              className={`text-lg font-bold ${
                result.ADP_Test_Result === "Passed" ? "text-green-600" : "text-red-600"
              }`}
            >
              ✅ Result: {result.ADP_Test_Result}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;

