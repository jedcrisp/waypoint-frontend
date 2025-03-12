import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { UploadCloud, CheckCircle, XCircle, Loader2 } from "lucide-react";

const AdpTest = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Handle file selection via drag & drop
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFiles([...acceptedFiles]);
      setResults([]);
      setError(null);
    }
  }, []);

  // Setup dropzone with noClick and noKeyboard
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv",
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  // Handle file upload for multiple files
  const handleUpload = async () => {
    if (files.length === 0) {
      setError("❌ Please select at least one file before uploading.");
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);

    const uploadedResults = [];

    // Process each file
    for (let file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        console.log("🚀 Uploading file to API:", "http://127.0.0.1:8000/upload-csv/adp");
        console.log("📂 File Selected:", file.name);
        const response = await axios.post("http://127.0.0.1:8000/upload-csv/adp", formData, {
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
    if (e.key === "Enter" && files.length > 0 && !loading) {
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
        📂 Upload ADP Test Files
      </h2>

      {/* Drag & Drop Upload Box */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        {files.length > 0 ? (
          <p className="text-green-600 font-semibold">Selected {files.length} file(s)</p>
        ) : isDragActive ? (
          <p className="text-blue-600">📂 Drop the CSV files here</p>
        ) : (
          <p className="text-gray-600">Drag & drop your CSV files here</p>
        )}
      </div>

      {/* Dedicated "Choose Files" Button */}
      <button
        type="button"
        onClick={open}
        className="mt-4 w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
      >
        Choose Files
      </button>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        className={`w-full mt-4 flex justify-center items-center px-4 py-2 text-white rounded-md ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
        }`}
        disabled={loading || files.length === 0}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Upload"}
      </button>

      {error && (
        <div className="mt-3 flex items-center text-red-500">
          <XCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Display Results */}
      {results.length > 0 && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h3 className="font-bold text-lg text-gray-700 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            ADP Test Results:
          </h3>
          {results.map((resultObj, index) => (
            <div key={index} className="mt-2 space-y-2">
              <p>
                <strong>File:</strong> {resultObj.fileName}
              </p>
              <p>
                <strong>HCE ADP (%):</strong>{" "}
                <span className="text-blue-700">
                  {resultObj.data["HCE ADP (%)"] !== undefined
                    ? resultObj.data["HCE ADP (%)"] + "%"
                    : "N/A"}
                </span>
              </p>
              <p>
                <strong>NHCE ADP (%):</strong>{" "}
                <span className="text-green-700">
                  {resultObj.data["NHCE ADP (%)"] !== undefined
                    ? resultObj.data["NHCE ADP (%)"] + "%"
                    : "N/A"}
                </span>
              </p>
              <p
                className={`text-lg font-bold ${
                  resultObj.data["Test Result"] === "Passed" ? "text-green-600" : "text-red-600"
                }`}
              >
                ✅ Result: {resultObj.data["Test Result"]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdpTest;
