import React, { useState, useContext } from "react";
import { TestContext } from "../App";

export default function FileUpload() {
  const { setUploadedFile } = useContext(TestContext);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith(".csv")) {
      setFileName(file.name);
      const reader = new FileReader();

      reader.onload = (e) => {
        const fileContent = e.target.result;
        setUploadedFile(fileContent); // Store CSV data in global context
      };

      reader.readAsText(file);
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

  return (
    <div className="bg-white shadow-md p-4 rounded w-full max-w-lg text-center">
      <h2 className="text-lg font-semibold text-gray-800">Upload a CSV File</h2>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mt-2 block w-full border p-2 rounded"
      />
      {fileName && <p className="text-sm text-green-600 mt-2">Uploaded: {fileName}</p>}
    </div>
  );
}
