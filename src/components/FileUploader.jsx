import React, { useRef, useState } from "react";
import Papa from "papaparse";
import PropTypes from "prop-types";

export default function FileUploader({ onParse, error, setError, buttonClassName = "" }) {
  const [fileName, setFileName] = useState("Drag and Drop file Here");
  const [isDragging, setIsDragging] = useState(false); // Track drag-over state
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) {
      setFileName("Drag and Drop file Here");
      return;
    }

    setFileName(file.name);
    setError(null);

    Papa.parse(file, {
      complete: (result) => {
        const headers = result.data[0] || [];
        const rows = result.data.slice(1).filter(row => row.some(cell => cell));
        onParse(rows, headers);
      },
      header: false,
      skipEmptyLines: true,
      error: (err) => {
        setError("Error parsing CSV file: " + err.message);
      },
    });
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleInputChange = (event) => {
    const file = event.target.files[0];
    handleFileChange(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      handleFileChange(file);
    } else {
      setError("Please drop a valid CSV file.");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col items-start">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleInputChange}
        className="hidden"
      />
      <div
        className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-200 ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <button
          onClick={handleClick}
          className={`border border-gray-300 rounded px-3 py-2 bg-white text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-3 ${buttonClassName}`}
        >
          Choose File
        </button>
        <span className="text-gray-500">{fileName}</span>
      </div>
    </div>
  );
}

FileUploader.propTypes = {
  onParse: PropTypes.func.isRequired,
  error: PropTypes.string,
  setError: PropTypes.func.isRequired,
  buttonClassName: PropTypes.string,
};
