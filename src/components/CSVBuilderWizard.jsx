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
    "Employee ID", "First Name", "Last Name", "DOB",
    "DOH", "Employment Status", "Hours Worked", "Termination Date",
    "Plan Entry Date", "Compensation", "HCE", "Employee Deferral",
    "Union Employee", "Part-Time / Seasonal",
    "Ownership %", "Family Relationship", "Family Member", "Excluded from Test"
  ],
  "ACP Test": [
    "Last Name", "First Name", "Employee ID", "DOB", "DOH",
    "Employment Status", "Plan Entry Date", "Compensation", "Employer Match",
    "Contribution Percentage", "Participating", "Total Contribution",
    "Excluded from Test", "Union Employee", "Part-Time / Seasonal", "HCE",
    "Family Relationship", "Family Member"
  ],
  "Top Heavy Test": [
    "Last Name", "First Name", "Employee ID", "DOB", "DOH",
    "Employment Status", "Plan Assets", "Compensation",
    "Excluded from Test", "Key Employee", "Ownership %", "Family Relationship", "Family Member"
  ],
  "Average Benefit Test": [
    "Last Name", "First Name", "Employee ID", "DOB", "DOH",
    "Employment Status", "Plan Entry Date", "Plan Assets", "HCE", "Compensation",
    "Excluded from Test", "Union Employee", "Part-Time / Seasonal", "Key Employee",
    "Family Relationship", "Family Member"
  ],
  "Coverage Test": [
    "Last Name", "First Name", "Employee ID", "DOB", "DOH",
    "Employment Status", "Plan Entry Date", "Eligible for Plan",
    "Excluded from Test", "Union Employee", "Part-Time / Seasonal", "HCE",
    "Family Relationship", "Family Member"
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
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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
        autoMap[header] = undefined;
      });
      autoMap.autoHCE = autoGenerateHCE;
      autoMap.autoKey = autoGenerateKeyEmployee;

      setSuggestedMap(autoMap);
      setColumnMap(autoMap);
    } else {
      setSuggestedMap({});
      setColumnMap({});
    }
  }, [selectedTests, autoGenerateHCE, autoGenerateKeyEmployee]);

  const allHeaders = useMemo(
    () =>
      Array.from(
        new Set(Object.values(REQUIRED_HEADERS_BY_TEST).flat())
      ),
    []
  );

  const requiredHeaders = useMemo(() => {
    const testLabels = selectedTests.map(value => 
      Object.keys(TEST_TYPE_MAP).find(key => TEST_TYPE_MAP[key] === value) || ""
    ).filter(Boolean);
    return Array.from(new Set(testLabels.flatMap(t => REQUIRED_HEADERS_BY_TEST[t] || [])));
  }, [selectedTests]);

  const mandatoryHeaders = requiredHeaders.filter(h => h !== "HCE" && h !== "Key Employee");
  const isDownloadEnabled = mandatoryHeaders.every(h => columnMap[h] && columnMap[h] !== "none");

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
      setMappedRows([]);
      return [];
    }

    const processedRows = originalRows.map(r => {
      const out = {};
      requiredHeaders.forEach(h => {
        if (columnMap[h]) {
          out[h] = r[columnMap[h]] ?? "";
        } else if (h === "HCE" && columnMap.autoHCE) {
          out.HCE = isHCE(r[columnMap.Compensation], planYear);
        } else if (h === "Key Employee" && columnMap.autoKey) {
          out["Key Employee"] = isKeyEmployee(r, columnMap, planYear);
        } else {
          out[h] = "";
        }
        if (h === "DOH" && columnMap["DOH"] && r[columnMap["DOH"]]) {
          out["Years of Service"] = calculateYearsOfService(r[columnMap["DOH"]], planYear);
        }
      });
      return out;
    });
    setMappedRows(processedRows);
    return processedRows;
  };

  useEffect(() => {
    processRows();
  }, [originalRows, columnMap, planYear, requiredHeaders]);

  function handleParse(rows, headers) {
    const objRows = rows.map(rowArray => {
      const obj = {};
      headers.forEach((hdr, i) => {
        obj[hdr] = rowArray[i];
      });
      return obj;
    });
    setOriginalRows(objRows);
    setRawHeaders(headers);
    setIsFileUploaded(true);
    const norm = headers.map(h => ({ original: h, normalized: normalizeHeader(h) }));
    const autoMap = {};
    requiredHeaders.forEach(req => {
      const key = normalizeHeader(req);
      let match;
      if (req === "DOH") {
        match = norm.find(c => ["doh", "dateofhire", "hiredate", "startdate", "date_hired"].includes(c.normalized));
      } else if (req === "DOB") {
        match = norm.find(c => ["dob", "birthdate", "dateofbirth"].includes(c.normalized));
      } else {
        match = norm.find(c => c.normalized === key);
      }
      if (match) {
        autoMap[req] = match.original;
      } else {
        autoMap[req] = undefined;
      }
    });
    autoMap.autoHCE = autoGenerateHCE;
    autoMap.autoKey = autoGenerateKeyEmployee;
    setSuggestedMap(autoMap);
    setColumnMap(autoMap);
  }

  function handleChangeFile() {
    setRawHeaders([]);
    setOriginalRows([]);
    setMappedRows([]);
    setSuggestedMap({});
    setColumnMap({});
    setIsFileUploaded(false);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
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
          if (!mappedRow[header] && columnMap[header]) {
            mappedRow[header] = row[columnMap[header]] || "";
          }
          const booleanLikeColumns = [
            "Excluded from Test",
            "Employment Status",
            "Union Employee",
            "Part-Time / Seasonal",
            "Family Relationship",
            "Family Member",
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

      const csv = Papa.unparse(mappedRowsForUpload);
      const blob = new Blob([csv], { type: "text/csv" });

      for (const testValue of selectedTests) {
        const form = new FormData();
        form.append("file", new File([blob], "temp.csv"));
        form.append("test_type", testValue);
        form.append("plan_year", parseInt(planYear, 10));

        const { data } = await axios.post(`${API_URL}/preview-csv`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
    setShowDownloadConfirm(true);
  }

  function doDownload() {
    const processedRows = processRows();
    if (processedRows.length === 0) {
      setErrorMessage("No data to download. Please ensure a CSV is uploaded and columns are mapped.");
      setShowDownloadConfirm(false);
      return;
    }

    const rowsForDownload = processedRows.map(row => {
      const out = { ...row };
      if (columnMap.autoHCE && !out.HCE && columnMap.Compensation) {
        out.HCE = isHCE(row.Compensation, planYear);
      }
      if (columnMap.autoKey && !out["Key Employee"] && columnMap.Compensation && columnMap["Ownership %"] && columnMap["Family Member"] && columnMap["Employment Status"]) {
        out["Key Employee"] = isKeyEmployee(row, columnMap, planYear);
      }
      return out;
    });

    const metadataRow = { PlanYear: planYear };
    const csvData = [metadataRow, ...rowsForDownload];
    const csv = Papa.unparse(csvData, { header: true });

    sessionStorage.setItem('newCSV', csv);

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
    if (selectedTests.length === 1) {
      const testValue = selectedTests[0];
      const testLabel = Object.keys(TEST_TYPE_MAP).find(key => TEST_TYPE_MAP[key] === testValue) || "";
      const route = TEST_ROUTE_MAP[testLabel];

      if (route) {
        navigate(route, { 
          state: { loadNewCSV: true, planYear }, 
          replace: false 
        });
      } else {
        setErrorMessage("Failed to navigate to test page: Route not found.");
      }
    } else {
      setErrorMessage("Navigation failed: Please select exactly one test.");
    }
    setShowRoutePrompt(false);
  }

  function downloadBlankTemplate() {
    try {
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
    } catch (err) {
      console.error("Error in downloadBlankTemplate:", err);
      setErrorMessage("Failed to download blank template. Please try again.");
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">CSV Builder</h1>
            <button
              onClick={() => setTourRun(true)}
              className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 text-sm font-medium"
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
                      setIsFileUploaded(false);
                    } else {
                      setSelectedTests(newTests);
                      setRawHeaders([]);
                      setSuggestedMap({});
                      setColumnMap({});
                      setMappedRows([]);
                      setErrorMessage(null);
                      setIsFileUploaded(false);
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

              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => {
                    if (typeof downloadBlankTemplate === "function") {
                      downloadBlankTemplate();
                    } else {
                      console.error("downloadBlankTemplate is not defined");
                      setErrorMessage("Failed to download blank template: Function not found.");
                    }
                  }}
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
              <FileUploader 
                onParse={handleParse} 
                error={errorMessage} 
                setError={setErrorMessage} 
                fileInputRef={fileInputRef}
              />
              {isFileUploaded && (
                <button
                  onClick={handleChangeFile}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  Change File
                </button>
              )}
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
                      <span className="absolute top-[-50px] left-1/2 transform -translate-x-1/2 bg-blue-100 text-gray-800 text-sm p-2 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none min-w-[300px]">
                        Automatically determines if an employee is a Highly<br />Compensated Employee based on compensation.
                      </span>
                    </div>
                    <div className="relative flex items-center border border-gray-300 rounded-md p-3 group">
                      <input
                        type="checkbox"
                        checked={autoGenerateKeyEmployee}
                        onChange={(e) => setAutoGenerateKeyEmployee(e.target.checked)}
                        disabled={!(columnMap.Compensation && columnMap["Ownership %"] && columnMap["Family Member"] && columnMap["Employment Status"])}
                        className="mr-2"
                      />
                      <label className="text-gray-700">Auto-generate Key Employee</label>
                      <span className="absolute top-[-50px] left-1/2 transform -translate-x-1/2 bg-blue-100 text-gray-800 text-sm p-2 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none min-w-[400px]">
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
                    canAutoGenerateKeyEmployee={() => !!columnMap.Compensation && !!columnMap["Ownership %"] && !!columnMap["Family Member"] && !!columnMap["Employment Status"]}
                    suggestedMap={suggestedMap}
                    isFileUploaded={isFileUploaded}
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
