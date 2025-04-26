// src/components/FileUploader.jsx
import React from "react";
import Papa from "papaparse";

export default function FileUploader({ onParse, error, setError }) {
  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: ({ data, meta }) => onParse(data, meta.fields),
      error: err => setError(`Parse error: ${err.message}`),
    });
  };

  return (
    <div className="border p-4 rounded bg-gray-50">
      <input
        type="file"
        accept=".csv"
        onChange={handleFile}
        aria-label="Upload CSV File"
      />
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
