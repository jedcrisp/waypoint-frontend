import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const TestFileUploader = ({ testType, testLabel }) => {
  const navigate = useNavigate();
  const [planYear, setPlanYear] = useState("");

  const handleDownloadTemplate = () => {
    // Redirect to CSVBuilderWizard with the test and plan year
    navigate("/csv-builder", {
      state: {
        selectedTest: testType, // Test value (e.g., "adp", "acp")
        planYear: planYear || new Date().getFullYear().toString(), // Use current year if not selected
      },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">📁</span> Upload {testLabel} File
      </h2>
      <div className="mb-4">
        <select
          value={planYear}
          onChange={(e) => setPlanYear(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-600"
        >
          <option value="">-- Select Plan Year --</option>
          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center mb-4">
        <p className="text-gray-600">Drag & drop a CSV file here.</p>
      </div>
      <div className="flex flex-col space-y-3">
        <button
          onClick={handleDownloadTemplate}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Download CSV Template
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Choose File
        </button>
        <button className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
          Upload & Save PDF
        </button>
      </div>
    </div>
  );
};

export default TestFileUploader;