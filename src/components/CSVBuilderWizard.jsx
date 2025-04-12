// src/components/CSVBuilderWizard.jsx
import React, { useState, useEffect } from "react";
import Papa from "papaparse";

const HCE_THRESHOLDS = {
  2016: 120000,
  2017: 120000,
  2018: 120000,
  2019: 120000,
  2020: 125000,
  2021: 130000,
  2022: 130000,
  2023: 135000,
  2024: 150000,
  2025: 155000,
};

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
  const [selectedTest, setSelectedTest] = useState("");
  const [columnMap, setColumnMap] = useState({});
  const [planYear, setPlanYear] = useState("2025");
  const [autoGenerateHCE, setAutoGenerateHCE] = useState(false);
  const [originalRows, setOriginalRows] = useState([]);
  const [savedMappings, setSavedMappings] = useState(() => {
    const saved = localStorage.getItem("csvColumnMappings");
    return saved ? JSON.parse(saved) : {};
  });
  const [showModal, setShowModal] = useState(false);
  const [nextRoute, setNextRoute] = useState(null);

  const requiredHeaders = REQUIRED_HEADERS_BY_TEST[selectedTest] || [];

  useEffect(() => {
    if (savedMappings[selectedTest]) {
      setColumnMap(savedMappings[selectedTest]);
    } else {
      setColumnMap({});
    }
  }, [selectedTest]);

  const normalize = (str) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: function (results) {
        const headers = results.meta.fields;
        setRawHeaders(headers);
        setOriginalRows(results.data);

        const normalizedRaw = headers.map((h) => ({
          original: h,
          normalized: normalize(h),
        }));

        const autoMap = {};
        REQUIRED_HEADERS_BY_TEST[selectedTest]?.forEach((required) => {
          const match = normalizedRaw.find(
            (col) => normalize(required) === col.normalized
          );
          if (match) {
            autoMap[required] = match.original;
          }
        });

        setColumnMap(autoMap);
      },
    });
  };

  const handleSelectChange = (requiredHeader, selectedValue) => {
    const updatedMap = { ...columnMap, [requiredHeader]: selectedValue };
    setColumnMap(updatedMap);
  };

  const handleSaveMapping = () => {
    const newMappings = { ...savedMappings, [selectedTest]: columnMap };
    setSavedMappings(newMappings);
    localStorage.setItem("csvColumnMappings", JSON.stringify(newMappings));
    alert("Mapping saved for reuse!");
  };

  const handleDownload = () => {
    const unmapped = requiredHeaders.filter(
      (header) => !columnMap[header] && !(header === "HCE" && autoGenerateHCE)
    );

    if (unmapped.length > 0) {
      alert(`Please map all required fields before downloading.\nUnmapped: ${unmapped.join(", ")}`);
      return;
    }

    const mappedRows = originalRows.map((row) => {
      const newRow = {};
      requiredHeaders.forEach((header) => {
        if (columnMap[header]) {
          newRow[header] = row[columnMap[header]] ?? "";
        } else if (header === "HCE" && autoGenerateHCE) {
          const comp = parseFloat(row[columnMap["Compensation"]] ?? 0);
          const threshold = HCE_THRESHOLDS[parseInt(planYear)] ?? 155000;
          newRow["HCE"] = comp >= threshold ? "Yes" : "No";
        } else {
          newRow[header] = "";
        }
      });
      return newRow;
    });

    const csv = Papa.unparse(mappedRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedTest.replace(/\s+/g, "_")}_Mapped.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const routeMap = {
      "ADP Test": "/test-adp",
      "ACP Test": "/test-acp",
      "Top Heavy Test": "/test-top-heavy",
      "Average Benefit Test": "/test-average-benefit",
      "Coverage Test": "/test-coverage",
    };
    setNextRoute(routeMap[selectedTest]);
    setShowModal(true);
    setSelectedTest("");
  };

  const isDownloadEnabled = () => {
    return requiredHeaders.every((header) =>
      columnMap[header] || (header === "HCE" && autoGenerateHCE)
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">🛠️ CSV Builder Wizard</h1>

      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 mb-6">
        <input type="file" accept=".csv" onChange={handleFileUpload} className="" />
        <select
          value={selectedTest}
          onChange={(e) => setSelectedTest(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">-- Choose a Test --</option>
          {Object.keys(REQUIRED_HEADERS_BY_TEST).map((test) => (
            <option key={test} value={test}>{test}</option>
          ))}
        </select>
        <select
          value={planYear}
          onChange={(e) => setPlanYear(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {Array.from({ length: 20 }, (_, i) => 2010 + i).reverse().map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <button
          onClick={handleDownload}
          disabled={!isDownloadEnabled()}
          className={`px-4 py-2 rounded text-white ${isDownloadEnabled() ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
        >
          Download Mapped CSV
        </button>
      </div>

      {requiredHeaders.includes("HCE") && !columnMap["HCE"] && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-sm rounded">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoGenerateHCE}
              onChange={(e) => setAutoGenerateHCE(e.target.checked)}
            />
            HCE column missing. Auto-generate HCE from compensation + plan year?
          </label>
        </div>
      )}

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

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-2">✅ File downloaded!</h2>
            <p className="mb-4">Would you like to go to the test now?</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowModal(false)}
              >
                Stay Here
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => {
                  setShowModal(false);
                  if (nextRoute) window.location.href = nextRoute;
                }}
              >
                Go to Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
