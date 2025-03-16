import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const MultiTestUpload = () => {
  const [files, setFiles] = useState([]);
  const [selectedTest, setSelectedTest] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const API_URL = "http://localhost:8000/upload-csv";  // Ensure this is the correct URL for your backend

  const availableTests = [
    "adp",
    "acp",
    "dcap_owners",
    // Add other tests as needed
  ];

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFiles([...acceptedFiles]);
      setResults([]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv",
    multiple: true,
  });

  const handleUpload = async () => {
    if (files.length === 0) return setError("❌ Please select at least one file.");
    if (!selectedTest) return setError("❌ Please select a test.");

    setLoading(true);
    setError(null);
    setResults([]);
    const uploadedResults = [];

    for (let file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("selected_test", selectedTest);  // ✅ Send selected test as form-data

      try {
        const response = await axios.post(API_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedResults.push({ fileName: file.name, test: selectedTest, data: response.data.Results });
      } catch (err) {
        uploadedResults.push({ fileName: file.name, test: selectedTest, error: err.response?.data || err.message });
      }
    }

    setResults(uploadedResults);
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Multi-Test Upload</h2>
      <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer">
        <input {...getInputProps()} />
        {files.length > 0 ? (
          <p className="text-green-600 font-semibold">Selected {files.length} file(s)</p>
        ) : isDragActive ? (
          <p className="text-blue-600">Drop the CSV files here</p>
        ) : (
          <p className="text-gray-600">Drag & drop your CSV files here</p>
        )}
      </div>
      <button onClick={open} className="mt-4 w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md">Choose Files</button>
      <div className="mt-6">
        <h3 className="text-xl font-bold text-gray-700 mb-2">Select Test</h3>
        <div className="grid grid-cols-2 gap-4">
          {availableTests.map((test) => (
            <label key={test} className="flex items-center">
              <input type="radio" name="test" value={test} checked={selectedTest === test} onChange={() => setSelectedTest(test)} className="mr-2" />
              {test}
            </label>
          ))}
        </div>
      </div>
      <button onClick={handleUpload} className="w-full mt-4 flex justify-center items-center px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md" disabled={loading || files.length === 0 || !selectedTest}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Upload"}
      </button>
      {error && <div className="mt-3 flex items-center text-red-500"><XCircle className="w-5 h-5 mr-2" />{error}</div>}
      {results.length > 0 && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h3 className="font-bold text-lg text-gray-700 mb-4">Test Results</h3>
          {results.map((result, index) => (
            <div key={index} className="mt-4 border-t pt-4">
              <p><strong>File:</strong> {result.fileName}</p>
              <p><strong>Test:</strong> {result.test}</p>
              {result.data ? (
                <>
                  <p><strong>HCE ADP (%):</strong> {result.data["HCE ADP (%)"] ? result.data["HCE ADP (%)"] + "%" : "N/A"}</p>
                  <p><strong>NHCE ADP (%):</strong> {result.data["NHCE ADP (%)"] ? result.data["NHCE ADP (%)"] + "%" : "N/A"}</p>
                  <p><strong>Result:</strong> {result.data["Test Result"]}</p>
                </>
              ) : (
                <p className="text-red-600">Error: {JSON.stringify(result.error)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiTestUpload;
