import React, { useRef, useState } from "react";
import Papa from "papaparse";
import PropTypes from "prop-types";

export default function FileUploader({ onParse, error, setError, buttonClassName = "", fileInputRef, isEnabled }) {
  const [fileName, setFileName] = useState("Drag and Drop file Here");
  const [isDragging, setIsDragging] = useState(false);
  const localInputRef = useRef(null);
  const inputRef = fileInputRef || localInputRef;

  const handleFileChange = (file) => {
    if (!file) {
      setFileName("Drag and Drop file Here");
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError("Please upload a CSV file.");
      setFileName("Drag and Drop file Here");
      return;
    }

    setFileName(file.name);
    setError(null);

    Papa.parse(file, {
      complete: (result) => {
        if (result.errors.length) {
          setError("Error parsing CSV. Please check the file format.");
          setFileName("Drag and Drop file Here");
          return;
        }
        const { data } = result;
        if (data.length === 0) {
          setError("Uploaded CSV is empty.");
          setFileName("Drag and Drop file Here");
          return;
        }
        const headers = data[0] || [];
        const rows = data.slice(1).filter(row => row.some(cell => cell));
        onParse(rows, headers);
      },
      header: false,
      skipEmptyLines: true,
      error: (err) => {
        setError(`Error parsing CSV file: ${err.message}`);
        setFileName("Drag and Drop file Here");
      },
    });
  };

  const handleClick = (event) => {
    if (!isEnabled) {
      event.preventDefault();
      return;
    }
    inputRef.current.click();
  };

  const handleInputChange = (event) => {
    if (!isEnabled) {
      event.preventDefault();
      return;
    }
    const file = event.target.files[0];
    handleFileChange(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isEnabled) {
      return;
    }
    const file = event.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      handleFileChange(file);
    } else {
      setError("Please drop a valid CSV file.");
      setFileName("Drag and Drop file Here");
    }
  };

  const handleDragOver = (event) => {
    if (!isEnabled) {
      return;
    }
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col items-start relative group">
      <input
        type="file"
        accept=".csv"
        ref={inputRef}
        onChange={handleInputChange}
        className="hidden"
        disabled={!isEnabled}
      />
      <div
        className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-200 ${
          isEnabled && isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
        } ${!isEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <button
          onClick={handleClick}
          disabled={!isEnabled}
          className={`px-4 py-2 rounded text-white text-sm font-medium mr-3 ${
            isEnabled
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          } ${buttonClassName}`}
          aria-label="Choose a CSV file"
        >
          Choose File
        </button>
        <span className="text-gray-500">{fileName}</span>
        {!isEnabled && (
          <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-gray-800 text-white text-sm rounded-lg py-2 px-3 shadow-lg z-10">
            Please select at least one test and a plan year to upload a file.
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

FileUploader.propTypes = {
  onParse: PropTypes.func.isRequired,
  error: PropTypes.string,
  setError: PropTypes.func.isRequired,
  buttonClassName: PropTypes.string,
  fileInputRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  isEnabled: PropTypes.bool,
};

FileUploader.defaultProps = {
  isEnabled: true,
};
