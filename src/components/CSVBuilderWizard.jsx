import React, { useState, useMemo, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
import Papa from "papaparse";
import { useNavigate, useLocation } from "react-router-dom";
import { STATUS } from "react-joyride";
import Select from "react-select";

import FileUploader from "./FileUploader";
import HeaderMapper from "./HeaderMapper";
import DownloadActions from "./DownloadActions";
import ConfirmModal from "./ConfirmModal";
import CSVBuilderTour from "./CSVBuilderTour";

import { normalizeHeader, parseDateFlexible } from "../utils/dateUtils.js";
import { calculateYearsOfService, isHCE, isKeyEmployee } from "../utils/planCalculations.js";

const REQUIRED_HEADERS_BY_TEST = {
  "ADP Test": [
    "Employee ID", "Last Name", "First Name", "DOB", "DOH",
      "Employment Status", "Hours Worked", "Termination Date",
      "Plan Entry Date",
      "Compensation", "Employee Deferral",
      "HCE",
      "OwnershipPercentage", "FamilyRelationshipToOwner", "FamilyMemberOwnerID",
      "Excluded from Test", "Union Employee", "Part-Time / Seasonal"
    ],
  "ACP Test": [
    "Employee ID", "Last Name", "First Name", "DOB", "DOH",
      "Employment Status",
      "Plan Entry Date",
      "Compensation", "Employer Match", "Contribution Percentage", "Total Contribution", "Participating",
      "HCE",
      "OwnershipPercentage", "FamilyRelationshipToOwner", "FamilyMemberOwnerID",
      "Excluded from Test", "Union Employee", "Part-Time / Seasonal"
    ],
  "Top Heavy Test": [
    "Employee ID", "Last Name", "First Name", "DOB", "DOH",
      "Employment Status",
      "Plan Assets",
      "Compensation",
      "Key Employee", "Officer Status",
      "OwnershipPercentage", "FamilyRelationshipToOwner", "FamilyMemberOwnerID",
      "Excluded from Test"
    ],
  "Average Benefit Test": [
    "Employee ID", "Last Name", "First Name", "DOB", "DOH",
      "Employment Status",
      "Plan Entry Date", "Eligible for Plan",
      "Compensation", "Employee Deferral", "Employer Match",
      "HCE",
      "OwnershipPercentage", "FamilyRelationshipToOwner", "FamilyMemberOwnerID",
      "Excluded from Test", "Union Employee", "Part-Time / Seasonal"
    ],
  "Coverage Test": [
    "Employee ID", "Last Name", "First Name", "DOB", "DOH",
      "Employment Status",
      "Plan Entry Date", "Eligible for Plan",
      "Compensation",
      "HCE",
      "OwnershipPercentage", "FamilyRelationshipToOwner", "FamilyMemberOwnerID",
      "Excluded from Test", "Union Employee", "Part-Time / Seasonal"
    ],
};

const TEST_TYPE_MAP = {
  "ADP Test": "adp",
  "ACP Test": "acp",
  "Top Heavy Test": "top_heavy",
  "Average Benefit Test": "average_benefit",
  "Coverage Test": "coverage",
};

const TEST_ROUTE_MAP = {
  "ADP Test": "/test-adp",
  "ACP Test": "/test-acp-standard",
  "Top Heavy Test": "/test-top-heavy",
  "Average Benefit Test": "/test-average-benefit",
  "Coverage Test": "/test-coverage",
};

// Create test options including a "Select All" option
const TEST_OPTIONS = [
  { value: "select-all", label: "Select All" },
  ...Object.entries(TEST_TYPE_MAP).map(([label, value]) => ({
    value,
    label,
  })),
];

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

function getSummaryValue(summary, ...keys) {
  for (let key of keys) {
    if (summary[key] != null) return summary[key];
  }
  return 0;
}

export default function CSVBuilderWizard() {
  const [testsOpen, setTestsOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
  const [planYear, setPlanYear] = useState("");
  const [rawHeaders, setRawHeaders] = useState([]);
  const [suggestedMap, setSuggestedMap] = useState({});
  const [columnMap, setColumnMap] = useState({});
  const [originalRows, setOriginalRows] = useState([]);
  const [idToRow, setIdToRow] = useState({}); // Mapping of employee IDs to rows
  const [mappedRows, setMappedRows] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [showPostDownload, setShowPostDownload] = useState(false);
  const [showRoutePrompt, setShowRoutePrompt] = useState(false);
  const [tourRun, setTourRun] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isTestListOpen, setIsTestListOpen] = useState(false);
  const [autoGenerateHCE, setAutoGenerateHCE] = useState(false);
  const [autoGenerateKeyEmployee, setAutoGenerateKeyEmployee] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [csvFile, setCsvFile] = useState(null);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Log when CSVBuilderWizard is rendered
  useEffect(() => {
    console.log("CSVBuilderWizard rendered");
  }, []);

  // Pre-select test and plan year from navigation state
  useEffect(() => {
    if (location.state) {
      const { selectedTest, planYear: incomingPlanYear } = location.state;
      if (selectedTest) {
        setSelectedTests([selectedTest]);
      }
      if (incomingPlanYear) {
        setPlanYear(incomingPlanYear);
      }
    }
  }, [location.state]);

  // Initialize suggestedMap and columnMap when selectedTests changes
  useEffect(() => {
    if (selectedTests.length > 0) {
      const testLabels = selectedTests.map(value =>
        Object.keys(TEST_TYPE_MAP).find(key => TEST_TYPE_MAP[key] === value) || ""
      ).filter(Boolean);

      const headers = Array.from(
        new Set(testLabels.flatMap(t => REQUIRED_HEADERS_BY_TEST[t] || []))
      );

      const autoMap = {};
      headers.forEach(header => {
        autoMap[header] = "none"; // Headers start unmapped with "none"
      });
      autoMap.autoHCE = autoGenerateHCE;
      autoMap.autoKey = autoGenerateKeyEmployee;

      setSuggestedMap(autoMap);
      setColumnMap(autoMap);
    } else {
      setSuggestedMap({});
      setColumnMap({});
    }
  }, [selectedTests]);

  // Update columnMap's autoHCE and autoKey when autoGenerateHCE or autoGenerateKeyEmployee changes
  useEffect(() => {
    setColumnMap(prevMap => ({
      ...prevMap,
      autoHCE: autoGenerateHCE,
      autoKey: autoGenerateKeyEmployee,
    }));
  }, [autoGenerateHCE, autoGenerateKeyEmployee]);

  const requiredHeaders = useMemo(() => {
    const testLabels = selectedTests.map(value => 
      Object.keys(TEST_TYPE_MAP).find(key => TEST_TYPE_MAP[key] === value) || ""
    ).filter(Boolean);
    return Array.from(new Set(testLabels.flatMap(t => REQUIRED_HEADERS_BY_TEST[t] || [])));
  }, [selectedTests]);

  const mandatoryHeaders = requiredHeaders.filter(h => h !== "HCE" && h !== "Key Employee");
  const isDownloadEnabled = selectedTests.length > 0 && rawHeaders.length > 0 && mandatoryHeaders.every(h => columnMap[h] && columnMap[h] !== "none" && columnMap[h] !== undefined);

  // Add debugging logs
  useEffect(() => {
    console.log("selectedTests:", selectedTests);
    console.log("rawHeaders:", rawHeaders);
    console.log("mandatoryHeaders:", mandatoryHeaders);
    console.log("columnMap:", columnMap);
    console.log("isDownloadEnabled:", isDownloadEnabled);
    console.log("originalRows:", originalRows);
    console.log("idToRow:", idToRow);
  }, [selectedTests, rawHeaders, mandatoryHeaders, columnMap, isDownloadEnabled, originalRows, idToRow]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setTestsOpen(false);
        setIsTestListOpen(false);
      }
    };

    if (testsOpen || isTestListOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [testsOpen, isTestListOpen]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const processRows = () => {
    if (originalRows.length === 0) {
      console.log("originalRows is empty, cannot process rows.");
      setMappedRows([]);
      return [];
    }

    console.log("Processing rows with columnMap:", columnMap);
    console.log("Required headers:", requiredHeaders);

    const processedRows = originalRows.map((r, index) => {
      console.log(`Processing row ${index}:`, r);
      const out = {};
      requiredHeaders.forEach(h => {
        if (columnMap[h] && columnMap[h] !== "none") {
          const mappedValue = r[columnMap[h]] !== undefined ? r[columnMap[h]] : "";
          out[h] = mappedValue;
          console.log(`Mapped ${h} to ${columnMap[h]}: ${mappedValue}`);
        } else if (h === "HCE" && columnMap.autoHCE) {
          const compensation = r[columnMap.Compensation] || 0;
          out.HCE = isHCE(compensation, planYear, r, columnMap, idToRow);
          console.log(`Auto-generated HCE for compensation ${compensation}: ${out.HCE}`);
        } else if (h === "Key Employee" && columnMap.autoKey) {
          out["Key Employee"] = isKeyEmployee(r, columnMap, planYear);
          console.log(`Auto-generated Key Employee: ${out["Key Employee"]}`);
        } else {
          out[h] = "";
          console.log(`Set ${h} to empty string (no mapping)`);
        }
        if (h === "DOH" && columnMap["DOH"] && columnMap["DOH"] !== "none" && r[columnMap["DOH"]]) {
          out["Years of Service"] = calculateYearsOfService(r[columnMap["DOH"]], planYear);
          console.log(`Calculated Years of Service for DOH ${r[columnMap["DOH"]]}: ${out["Years of Service"]}`);
        }
      });
      return out;
    });

    console.log("Processed rows:", processedRows);
    setMappedRows(processedRows);
    return processedRows;
  };

  useEffect(() => {
    processRows();
  }, [originalRows, columnMap, planYear, requiredHeaders, idToRow]);

  function handleParse(rows, headers) {
    console.log("handleParse called with rows:", rows);
    console.log("handleParse headers:", headers);

    if (!rows || rows.length === 0) {
      console.log("No rows to parse.");
      setOriginalRows([]);
      setRawHeaders([]);
      setIdToRow({});
      setErrorMessage("The standards-compliant CSV file has no data rows.");
      return;
    }

    if (!headers || headers.length === 0) {
      console.log("No headers provided.");
      setOriginalRows([]);
      setRawHeaders([]);
      setIdToRow({});
      setErrorMessage("The standards-compliant CSV file has no headers.");
      return;
    }

    const objRows = rows.map((rowArray, index) => {
      console.log(`Parsing row ${index}:`, rowArray);
      const obj = {};
      headers.forEach((hdr, i) => {
        obj[hdr] = rowArray[i] !== undefined ? String(rowArray[i]) : "";
      });
      return obj;
    });

    console.log("Parsed objRows:", objRows);
    setOriginalRows(objRows);
    setRawHeaders(headers);

    // Create idToRow mapping
    const newIdToRow = {};
    objRows.forEach(row => {
      const employeeId = row["Employee ID"] || "";
      if (employeeId) {
        newIdToRow[employeeId.toLowerCase()] = row;
      }
    });
    setIdToRow(newIdToRow);
    console.log("Created idToRow mapping:", newIdToRow);

    const norm = headers.map(h => ({ original: h, normalized: normalizeHeader(h) }));
    const autoMap = {};
    requiredHeaders.forEach(req => {
      const key = normalizeHeader(req);
      let match;
      if (req === "DOH") {
        match = norm.find(c => ["doh", "dateofhire", "hiredate", "startdate", "date_hired"].includes(c.normalized));
      } else {
        match = norm.find(c => c.normalized === key);
      }
      if (match) {
        autoMap[req] = match.original;
      } else {
        autoMap[req] = "none";
      }
    });
    autoMap.autoHCE = autoGenerateHCE;
    autoMap.autoKey = autoGenerateKeyEmployee;
    setSuggestedMap(autoMap);
    setColumnMap(autoMap);
    console.log("Suggested columnMap:", autoMap);
  }

  function downloadBlankTemplate() {
    const testLabels = selectedTests.map(value =>
      Object.keys(TEST_TYPE_MAP).find(key => TEST_TYPE_MAP[key] === value) || ""
    ).filter(Boolean);

    const selectedHeaders = Array.from(
      new Set(testLabels.flatMap(t => REQUIRED_HEADERS_BY_TEST[t] || []))
    );

    const headersToDownload = selectedHeaders.length > 0 ? selectedHeaders : [];

    const csv = Papa.unparse([headersToDownload]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Waypoint_Blank_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handlePreview() {
    try {
      setErrorMessage(null);
      if (!selectedTests.length) throw new Error("Select at least one test");
      if (!originalRows.length) throw new Error("Please upload a CSV file.");
      if (!isDownloadEnabled) {
        setErrorMessage("Please map all required headers before previewing.");
        return;
      }
      if (!planYear || isNaN(parseInt(planYear, 10))) {
        setErrorMessage("Please select a valid plan year.");
        return;
      }
      const token = await getAuth().currentUser.getIdToken(true);
      if (!token) throw new Error("Not authenticated");

      let rowsToUpload = originalRows;
      const mappedRowsForUpload = rowsToUpload.map(row => {
        const mappedRow = { ...row };
        requiredHeaders.forEach(header => {
          if (!mappedRow[header] && columnMap[header] && columnMap[header] !== "none") {
            mappedRow[header] = row[columnMap[header]] || "";
          }
          const booleanLikeColumns = [
            "Excluded from Test",
            "Employment Status",
            "Union Employee",
            "Part-Time / Seasonal",
            "FamilyRelationshipToOwner",
            "FamilyMemberOwnerID",
            "Eligible for Plan",
            "Participating",
            "HCE",
            "Key Employee"
          ];
          if (booleanLikeColumns.includes(header) && mappedRow[header] !== undefined) {
            const value = String(mappedRow[header]).toLowerCase();
            if (header === "Excluded from Test" || header === "Union Employee" || header === "Part-Time / Seasonal" || 
                header === "Eligible for Plan" || header === "Participating" || header === "HCE" || header === "Key Employee") {
              mappedRow[header] = value === "true" || value === "1" || value === "yes" ? "yes" : "no";
            } else {
              mappedRow[header] = value;
            }
          }
        });
        if (selectedTests.includes("acp")) {
          const matchVal = columnMap["Employer Match"] ? parseFloat(mappedRow[columnMap["Employer Match"]]) || 0 : 0;
          const compVal = columnMap["Compensation"] ? parseFloat(mappedRow[columnMap["Compensation"]]) || 0 : 0;
          const defVal = columnMap["Employee Deferral"] ? parseFloat(mappedRow[columnMap["Employee Deferral"]]) || 0 : 0;
          mappedRow["Contribution Percentage"] = compVal > 0 ? (matchVal / compVal) * 100 : 0;
          mappedRow["Participating"] = matchVal > 0 ? "Yes" : "No";
          mappedRow["Total Contribution"] = defVal + matchVal;
        }
        return mappedRow;
      });

      console.log("mappedRowsForUpload after mapping:", mappedRowsForUpload);
      const csv = Papa.unparse(mappedRowsForUpload);
      const blob = new Blob([csv], { type: "text/csv" });

      for (const testValue of selectedTests) {
        const form = new FormData();
        form.append("file", new File([blob], "temp.csv"));
        form.append("test_type", testValue);
        form.append("plan_year", parseInt(planYear, 10));

        console.log("Sending request to /preview-csv with:", {
          test_type: testValue,
          plan_year: parseInt(planYear, 10),
          file: form.get("file"),
          token: token.substring(0, 10) + "...",
        });

        const { data } = await axios.post(`${API_URL}/preview-csv`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Preview response:", data);
      }
    } catch (err) {
      console.error("Preview error:", err);
      setErrorMessage(err.message);
    }
  }

  function handleDownloadClick() {
    if (!isDownloadEnabled) {
      setErrorMessage("Please map all required headers before downloading.");
      return;
    }
    if (originalRows.length === 0) {
      setErrorMessage("No data to download. Please upload a CSV file.");
      return;
    }
    setShowDownloadConfirm(true);
  }

  function doDownload() {
    console.log("Starting doDownload, originalRows:", originalRows);

    if (!originalRows || originalRows.length === 0) {
      setErrorMessage("No data to download. Please upload a CSV file.");
      setShowDownloadConfirm(false);
      return;
    }

    const processedRows = processRows();
    if (processedRows.length === 0) {
      setErrorMessage("No data to download after mapping. Please ensure columns are mapped correctly.");
      setShowDownloadConfirm(false);
      return;
    }

    const rowsForDownload = processedRows.map(row => {
      const out = { ...row };
      if (columnMap.autoHCE && columnMap.Compensation) {
        const compensation = row.Compensation || 0;
        out.HCE = isHCE(compensation, planYear, row, columnMap, idToRow);
        console.log(`Recalculated HCE for compensation ${compensation}: ${out.HCE}`);
      }
      if (columnMap.autoKey && columnMap.Compensation && columnMap["OwnershipPercentage"] && columnMap["FamilyMemberOwnerID"] && columnMap["Employment Status"]) {
        out["Key Employee"] = isKeyEmployee(row, columnMap, planYear);
      }
      // Add PlanYear to each row
      out.PlanYear = planYear;
      return out;
    });

    console.log("Rows for download with PlanYear:", rowsForDownload);

    if (rowsForDownload.length === 0) {
      setErrorMessage("No data to download after processing. Please check your mappings.");
      setShowDownloadConfirm(false);
      return;
    }

    // Reorder columns to have PlanYear first
    const csvData = rowsForDownload.map(row => {
      const orderedRow = { PlanYear: row.PlanYear };
      Object.keys(row).forEach(key => {
        if (key !== "PlanYear") {
          orderedRow[key] = row[key];
        }
      });
      return orderedRow;
    });

    console.log("CSV data before unparse:", csvData);
    const csv = Papa.unparse(csvData, { header: true });
    console.log("Generated CSV content:", csv);

    if (!csv || csv.trim() === "") {
      setErrorMessage("Generated CSV is empty. Please check your data and mappings.");
      setShowDownloadConfirm(false);
      return;
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Combined_Tests_${planYear}.csv`;
    a.click();
    setShowDownloadConfirm(false);
    setShowPostDownload(true);
    if (selectedTests.length === 1) {
      setTimeout(() => setShowRoutePrompt(true), 0);
    }
  }

  function handleRouteToTestPage() {
    console.log("handleRouteToTestPage called");
    console.log("Selected tests:", selectedTests);
    
    if (selectedTests.length === 1) {
      const testValue = selectedTests[0];
      console.log("Test value:", testValue);
      
      const testLabel = Object.keys(TEST_TYPE_MAP).find(key => TEST_TYPE_MAP[key] === testValue) || "";
      console.log("Test label:", testLabel);
      
      const route = TEST_ROUTE_MAP[testLabel];
      console.log("Target route:", route);
      
      if (route) {
        console.log(`Navigating to ${route}...`);
        navigate(route, { replace: false });
        console.log("Navigation completed");
      } else {
        console.error("Route not found for test label:", testLabel);
        setErrorMessage("Failed to navigate to test page: Route not found.");
      }
    } else {
      console.error("Expected exactly one selected test, found:", selectedTests.length);
      setErrorMessage("Navigation failed: Please select exactly one test.");
    }
    setShowRoutePrompt(false);
  }

  const handleCsvUpload = (e) => {
    const file = e.target.files ? e.target.files[0] : e[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setCsvFile(file);
      Papa.parse(file, {
        complete: (results) => {
          handleParse(results.data, results.meta.fields);
        },
        error: (err) => setErrorMessage('Failed to parse CSV: ' + err.message),
      });
    } else {
      setErrorMessage('Please upload a CSV file');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">CSV Builder</h1>
            <button
              onClick={() => setTourRun(true)}
              className="px-4 py-2 rounded profile text-white bg-blue-600 hover:bg-blue-700 text-sm font-medium"
            >
              Take a Tour
            </button>
          </div>

          <CSVBuilderTour
            run={isMounted && tourRun}
            callback={({ status }) => {
              if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
                setTourRun(false);
              }
            }}
          />

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-md shadow test-dropdown" ref={dropdownRef}>
              <div className="flex-1 min-w-[220px]">
                <Select
                  options={TEST_OPTIONS}
                  value={TEST_OPTIONS.filter(o => selectedTests.includes(o.value))}
                  onChange={(opts) => {
                    const newTests = opts.map(o => o.value);
                    if (newTests.includes("select-all")) {
                      const allTests = Object.values(TEST_TYPE_MAP);
                      setSelectedTests(allTests);
                      setRawHeaders([]);
                      setSuggestedMap({});
                      setColumnMap({});
                      setMappedRows([]);
                      setErrorMessage(null);
                    } else {
                      setSelectedTests(newTests);
                      setRawHeaders([]);
                      setSuggestedMap({});
                      setColumnMap({});
                      setMappedRows([]);
                      setErrorMessage(null);
                    }
                  }}
                  isMulti
                  placeholder="Select Tests…"
                  className="test-dropdown-select"
                />
              </div>

              <div>
                <select
                  className="border border-gray-300 rounded px-3 py-2 plan-year-select"
                  value={planYear}
                  onChange={e => setPlanYear(e.target.value)}
                >
                  <option value="">-- Plan Year --</option>
                  {Array.from({ length: 10 }, (_, i) => 2016 + i).reverse()
                    .map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="flex flex-wrap gap-2 ml-auto">
                <button
                  onClick={() => downloadBlankTemplate()}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 download-blank-template-button"
                >
                  Download Blank Template
                </button>
                <DownloadActions
                  isDownloadEnabled={isDownloadEnabled}
                  onDownloadClick={handleDownloadClick}
                  showDownloadConfirm={showDownloadConfirm}
                  onConfirmDownload={doDownload}
                  onCancelDownload={() => setShowDownloadConfirm(false)}
                  className="download-csv-button"
                />
              </div>
            </div>

            <div className="file-uploader">
              <div
                className={`w-full border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                  isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                }`}
                onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    handleCsvUpload([files[0]]);
                  }
                }}
              >
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 mb-2">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                    id="csv-builder-upload"
                    disabled={!(selectedTests.length > 0 && planYear && !isNaN(parseInt(planYear, 10)))}
                  />
                  <label
                    htmlFor="csv-builder-upload"
                    className={`px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 cursor-pointer transition-colors ${!(selectedTests.length > 0 && planYear && !isNaN(parseInt(planYear, 10))) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Browse Files
                  </label>
                  {csvFile && (
                    <p className="mt-2 text-green-600 font-semibold">{csvFile.name}</p>
                  )}
                  {!(selectedTests.length > 0 && planYear && !isNaN(parseInt(planYear, 10))) && (
                    <p className="mt-2 text-sm text-gray-600">
                      Please select at least one test and a plan year to upload a CSV file.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="header-mapper">
              {selectedTests.length > 0 ? (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Map Headers</h2>
                  <div className="flex flex-row gap-6 mb-4">
                    <div className="relative flex items-center border border-gray-300 rounded-md p-3 group">
                      <input
                        type="checkbox"
                        checked={autoGenerateHCE}
                        onChange={(e) => setAutoGenerateHCE(e.target.checked)}
                        disabled={!columnMap.Compensation}
                        className="mr-2"
                      />
                      <label className="text-gray-700">Auto-generate HCE</label>
                      <span className="absolute left-[110%] top-1/2 transform -translate-y-1/2 bg-blue-500 text-white text-sm p-2 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none min-w-[300px] z-10">
                        Automatically determines if an employee is a Highly<br />Compensated Employee based on compensation.
                      </span>
                    </div>
                    <div className="relative flex items-center border border-gray-300 rounded-md p-3 group">
                      <input
                        type="checkbox"
                        checked={autoGenerateKeyEmployee}
                        onChange={(e) => setAutoGenerateKeyEmployee(e.target.checked)}
                        disabled={!(columnMap.Compensation && columnMap["OwnershipPercentage"] && columnMap["FamilyMemberOwnerID"] && columnMap["Employment Status"])}
                        className="mr-2"
                      />
                      <label className="text-gray-700">Auto-generate Key Employee</label>
                      <span className="absolute left-[110%] top-1/2 transform -translate-y-1/2 bg-blue-500 text-white text-sm p-2 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none min-w-[400px] z-10">
                        Automatically identifies Key Employees<br />based on compensation, ownership, family relationships, and employment status.
                      </span>
                    </div>
                  </div>
                  <HeaderMapper
                    rawHeaders={rawHeaders.length > 0 ? rawHeaders : requiredHeaders}
                    requiredHeaders={requiredHeaders}
                    columnMap={columnMap}
                    setColumnMap={setColumnMap}
                    mandatoryHeaders={mandatoryHeaders}
                    autoGenerateHCE={autoGenerateHCE}
                    canAutoGenerateHCE={() => !!columnMap.Compensation}
                    autoGenerateKeyEmployee={autoGenerateKeyEmployee}
                    canAutoGenerateKeyEmployee={() => !!columnMap.Compensation && !!columnMap["OwnershipPercentage"] && !!columnMap["FamilyMemberOwnerID"] && !!columnMap["Employment Status"]}
                    suggestedMap={suggestedMap}
                    isFileUploaded={rawHeaders.length > 0}
                  />
                </div>
              ) : (
                <div className="p-4 border rounded bg-white text-blue-600 text-lg text-center">
                  Select a test to map headers.
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded error-message">
                {errorMessage}
              </div>
            )}

            {showDownloadConfirm && (
              <ConfirmModal
                title="Confirm Download"
                message="Wait! Confirm the correct Plan Year has been chosen?"
                confirmLabel="Download"
                cancelLabel="Cancel"
                onConfirm={doDownload}
                onCancel={() => setShowDownloadConfirm(false)}
                className="download-confirm-modal"
              />
            )}

            {showPostDownload && (
              <ConfirmModal
                title="✅ Downloaded"
                message="CSV ready"
                confirmLabel="OK"
                cancelLabel="Close"
                onConfirm={() => setShowPostDownload(false)}
                onCancel={() => setShowPostDownload(false)}
                className="post-download-modal"
              />
            )}

            {showRoutePrompt && selectedTests.length === 1 && (
              <ConfirmModal
                title="Navigate to Test Page"
                message={`Would you like to navigate to the ${
                  Object.keys(TEST_TYPE_MAP).find(key => TEST_TYPE_MAP[key] === selectedTests[0]) || ""
                } page?`}
                confirmLabel="Yes"
                cancelLabel="No"
                onConfirm={handleRouteToTestPage}
                onCancel={() => setShowRoutePrompt(false)}
                className="route-prompt-modal"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
