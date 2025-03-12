import { useState } from "react";
import axios from "axios";
import { UploadCloud, CheckCircle, XCircle, Loader2 } from "lucide-react";

const CafeteriaUploadForm = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setResult(null);
    setError(null);
  };

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
      const response = await axios.post("http://127.0.0.1:8000/upload-cafeteria/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Success:", response.data);
      setResult(response.data);
    } catch (err) {
      console.error("Upload error:", err.response ? err.response.data : err);
      setError("❌ Failed to upload file. Please check the format and try again.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">📂 Upload Cafeteria Plan Test File</h2>

      {/* File Input */}
      <input type="file" onChange={handleFileChange} className="mb-4 border rounded p-2 w-full" />

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        className={`w-full mt-2 px-4 py-2 text-white rounded-md ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
        }`}
        disabled={loading}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Upload"}
      </button>

      {/* Display Errors */}
      {error && (
        <div className="mt-3 flex items-center text-red-500">
          <XCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Display Results */}
      {result && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h3 className="font-bold text-lg text-gray-700 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Cafeteria Plan Test Results:
          </h3>
          <pre className="text-sm text-gray-700">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CafeteriaUploadForm;


