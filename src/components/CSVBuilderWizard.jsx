// src/components/CSVBuilderWizard.jsx
import React, { useState } from "react";
import Papa from "papaparse";

const REQUIRED_HEADERS_BY_TEST = {
  "ADP Test": [
    "Last Name", "First Name", "Employee ID", "Compensation", "Employee Deferral",
    "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test",
    "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"
  ],
  "ACP Test": [
    "Last Name", "First Name", "Employee ID", "Compensation", "Employer Match",
    "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test",
    "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"
  ],
  "Top Heavy Test": [
    "Last Name", "First Name", "Employee ID", "Plan Assets", "Key Employee",
    "Ownership %", "Family Member", "DOB", "DOH", "Excluded from Test", "Employment Status"
  ],
  "Average Benefit Test": [
    "Last Name", "First Name", "Employee ID", "DOB", "DOH", "Employment Status",
    "Excluded from Test", "Union Employee", "Part-Time / Seasonal", "Plan Entry Date",
    "Plan Assets", "Key Employee"
  ],
  "Coverage Test": [
    "Last Name", "First Name", "Employee ID", "Eligible for Plan", "HCE",
    "DOB", "DOH", "Employment Status", "Excluded from Test",
    "Union Employee", "Part-Time / Seasonal", "Plan Entry Date"
  ]
};

export default function CSVBuilderWizard() {
  const [rawHeaders, setRawHeaders] = useState([]);
  const [selectedTest, setSelectedTest] = useState("ADP Test");
  const [columnMap, setColumnMap] = useState({});
  const [rawData, setRawData] = useState([]); // New: store the actual parsed data

  const requiredHeaders = REQUIRED_HEADERS_BY_TEST[selectedTest];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const headers = results.meta.fields;
        setRawHeaders(headers);
        setRawData(results.data); // Store full data

        const autoMap = {};
        requiredHeaders.forEach((reqHeader) => {
          const match = headers.find(
            (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "") === reqHeader.toLowerCase().replace(/[^a-z0-9]/g, "")
          );
          if (match) {
            autoMap[reqHeader] = match;
          }
        });

        setColumnMap(autoMap);
      },
    });
  };

  const handleSelectChange = (requiredHeader, selectedValue) => {
    setColumnMap((prev) => ({ ...prev, [requiredHeader]: selectedValue }));
  };

  const handleDownload = () => {
    if (!rawData.length) {
      alert("Please upload a CSV file first.");
      return;
    }

    const missingFields = requiredHeaders.filter((required) => !columnMap[required]);
  if (missingFields.length > 0) {
    alert(`Please map all required fields before downloading. Missing: ${missingFields.join(", ")}`);
    return;
  }

    // Ensure at least one mapping exists
    const mappedRows = rawData.map((row) => {
      const mappedRow = {};
      requiredHeaders.forEach((required) => {
        const selected = columnMap[required];
        mappedRow[required] = selected ? row[selected] ?? "" : "";
      });
      return mappedRow;
    });

    const csvString = Papa.unparse(mappedRows);

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${selectedTest.replace(/\s/g, "_")}_Mapped.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">CSV Builder</h1>

      <div className="flex justify-between items-center mb-6">
        <input type="file" accept=".csv" onChange={handleFileUpload} className="mr-4" />
        <select
          value={selectedTest}
          onChange={(e) => setSelectedTest(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {Object.keys(REQUIRED_HEADERS_BY_TEST).map((test) => (
            <option key={test} value={test}>{test}</option>
          ))}
        </select>
        <button
          onClick={handleDownload}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Download Mapped CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {requiredHeaders.map((header) => (
          <React.Fragment key={header}>
            <div className="bg-gray-100 px-4 py-2 rounded-md font-medium flex items-center h-10">
              {header}
            </div>
            <select
              value={columnMap[header] || ""}
              onChange={(e) => handleSelectChange(header, e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 h-10"
            >
              <option value="">-- Select Column --</option>
              {rawHeaders.map((raw) => (
                <option key={raw} value={raw}>{raw}</option>
              ))}
            </select>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
