
import React, { useState, useMemo, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import { STATUS } from "react-joyride";

import FileUploader from "./FileUploader";
import HeaderMapper from "./HeaderMapper";
import DownloadActions from "./DownloadActions";
import EnrichedTable from "./EnrichedTable";
import ConfirmModal from "./ConfirmModal";
import CSVBuilderTour from "./CSVBuilderTour";

import { normalizeHeader, parseDateFlexible } from "../utils/dateUtils.js";
import { calculateYearsOfService, isHCE, isKeyEmployee } from "../utils/planCalculations.js";
import { differenceInYears } from "date-fns";

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
    "Employment Status", "Plan Entry Date", "Plan Assets", "Compensation",
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

// Map test types to routes
const TEST_ROUTE_MAP = {
  "ADP Test": "/adp-test",
  "ACP Test": "/acp-test",
  "Top Heavy Test": "/top-heavy-test",
  "Average Benefit Test": "/average-benefit-test",
  "Coverage Test": "/coverage-test",
};

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// Helper: pick first existing key
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
  const [enrichedData, setEnrichedData] = useState({});
  const [summaryCounts, setSummaryCounts] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [showPostDownload, setShowPostDownload] = useState(false);
  const [showRoutePrompt, setShowRoutePrompt] = useState(false);
  const [tourRun, setTourRun] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isTestListOpen, setIsTestListOpen] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Merge required headers
  const requiredHeaders = useMemo(
    () => Array.from(new Set(selectedTests.flatMap(t => REQUIRED_HEADERS_BY_TEST[t] || []))),
    [selectedTests]
  );
  const mandatoryHeaders = requiredHeaders.filter(h => h !== "HCE" && h !== "Key Employee");
  const isDownloadEnabled = selectedTests.length > 0 && mandatoryHeaders.every(h => columnMap[h]);

  // Close dropdown when clicking outside
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

  // Set isMounted to true after the component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Parse CSV and suggest mappings
  function handleParse(rows, headers) {
    setOriginalRows(rows);
    setRawHeaders(headers);
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
      if (match) autoMap[req] = match.original;
    });
    setSuggestedMap(autoMap);
    setColumnMap({});
  }

  // Preview via backend for single or multiple tests
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
      // Ensure all required headers are included in the CSV
      const mappedRows = rowsToUpload.map(row => {
        const mappedRow = { ...row };
        requiredHeaders.forEach(header => {
          if (!mappedRow[header] && columnMap[header]) {
            mappedRow[header] = row[columnMap[header]] || "";
          }
          // Normalize boolean-like or categorical columns to strings
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
            // Normalize to "yes" or "no" for boolean-like fields
            if (header === "Excluded from Test" || header === "Union Employee" || header === "Part-Time / Seasonal" || 
                header === "Eligible for Plan" || header === "Participating" || header === "HCE" || header === "Key Employee") {
              mappedRow[header] = value === "true" || value === "1" || value === "yes" ? "yes" : "no";
            } else {
              // For other categorical fields like "Employment Status", "Family Relationship", "Family Member", just ensure it's a string
              mappedRow[header] = value;
            }
          }
        });
        // Augment ACP contributions
        if (selectedTests.includes("ACP Test")) {
          const matchVal = columnMap["Employer Match"] ? parseFloat(mappedRow[columnMap["Employer Match"]]) || 0 : 0;
          const compVal = columnMap["Compensation"] ? parseFloat(mappedRow[columnMap["Compensation"]]) || 0 : 0;
          const defVal = columnMap["Employee Deferral"] ? parseFloat(mappedRow[columnMap["Employee Deferral"]]) || 0 : 0;
          mappedRow["Contribution Percentage"] = compVal > 0 ? (matchVal / compVal) * 100 : 0;
          mappedRow["Participating"] = matchVal > 0 ? "Yes" : "No";
          mappedRow["Total Contribution"] = defVal + matchVal;
        }
        return mappedRow;
      });

      console.log("mappedRows after mapping:", mappedRows);
      const csv = Papa.unparse(mappedRows);
      const blob = new Blob([csv], { type: "text/csv" });

      const dataByTest = {};
      const combined = { total_employees: 0, total_eligible: 0, total_excluded: 0, total_hces: 0, total_participating: 0 };

      for (const test of selectedTests) {
        try {
          const form = new FormData();
          form.append("file", new File([blob], "temp.csv"));
          form.append("test_type", TEST_TYPE_MAP[test]);
          form.append("plan_year", parseInt(planYear, 10));

          console.log("Sending request to /preview-csv with:", {
            test_type: TEST_TYPE_MAP[test],
            plan_year: parseInt(planYear, 10),
            file: form.get("file"),
            token: token.substring(0, 10) + "...",
          });

          const { data } = await axios.post(`${API_URL}/preview-csv`, form, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const employees = data.employees || [];
          const summary = data.summary || {};
          dataByTest[test] = { employees, summary };
          combined.total_employees += getSummaryValue(summary, "total_employees", "Total Employees");
          combined.total_eligible += getSummaryValue(summary, "total_eligible", "Total Eligible Employees");
          combined.total_excluded += getSummaryValue(summary, "total_excluded", "Total Excluded Employees");
          combined.total_hces += getSummaryValue(summary, "total_key_employees", "Total Key Employees", "total_hces");
          combined.total_participating += getSummaryValue(summary, "total_participants", "Total Participants", "total_participating");
        } catch (err) {
          console.error(`Error for test ${test}:`, {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          });
          dataByTest[test] = { employees: [], summary: {}, error: err.response?.data?.detail || err.message };
          setErrorMessage(err.response?.data?.detail || err.message);
        }
      }

      setEnrichedData(dataByTest);
      setSummaryCounts(combined);
    } catch (err) {
      console.error("Preview error:", err);
      setErrorMessage(err.message);
      setEnrichedData({});
      setSummaryCounts({});
    }
  }

  // Download mapped CSV
  function handleDownloadClick() {
    if (!isDownloadEnabled) {
      return;
    }
    setShowDownloadConfirm(true);
  }

  function doDownload() {
    const mapped = originalRows.map(r => {
      const out = {};
      requiredHeaders.forEach(h => {
        if (columnMap[h]) out[h] = r[columnMap[h]] ?? "";
        else if (h === "HCE" && columnMap.autoHCE) out.HCE = isHCE(r[columnMap.Compensation], planYear);
        else if (h === "Key Employee" && columnMap.autoKey) out["Key Employee"] = isKeyEmployee(r, columnMap, planYear);
        else out[h] = "";
      });
      return out;
    });
    const csv = Papa.unparse(mapped);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Combined_Tests_${planYear}.csv`;
    a.click();
    setShowDownloadConfirm(false);
    // Show post-download modal for all cases
    setShowPostDownload(true);
    // If single test, show routing prompt after post-download
    if (selectedTests.length === 1) {
      setTimeout(() => setShowRoutePrompt(true), 0);
    }
  }

  // Handle routing to test page
  function handleRouteToTestPage() {
    if (selectedTests.length === 1) {
      const test = selectedTests[0];
      const route = TEST_ROUTE_MAP[test];
      if (route) {
        navigate(route);
      }
    }
    setShowRoutePrompt(false);
  }

  // Metrics for single-test preview
  const rowsWithMetrics = useMemo(() => {
    if (selectedTests.length !== 1) return [];
    const t = selectedTests[0];
    const emps = enrichedData[t]?.employees || [];
    return emps.map((r, i) => {
      const out = { ...r };
      out["Years of Service"] = calculateYearsOfService(originalRows[i][columnMap.DOH], planYear);
      const dob = parseDateFlexible(originalRows[i][columnMap.DOB]);
      out.Age = dob ? differenceInYears(new Date(+planYear, 11, 31), dob) : null;
      const comp = parseFloat(r.Compensation) || 0;
      const def = parseFloat(r["Employee Deferral"]) || 0;
      out["Deferral %"] = comp > 0 ? (def / comp) * 100 : 0;
      return out;
    });
  }, [enrichedData, originalRows, planYear, columnMap, selectedTests]);

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl w-full bg-white rounded-lg shadow-lg p-8">
          {/* Tour and Title Section */}
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
          {/* Form Section */}
          <div className="space-y-6">
            {/* Test selection with pills and pop-over */}
            <div className="test-dropdown relative" ref={dropdownRef}>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTestsOpen(o => !o);
                  }}
                  className="px-3 py-1 rounded text-blue-600 border border-blue-600 hover:bg-blue-50"
                >
                  {selectedTests.length > 0 ? "Edit Tests" : "Select Tests"}
                </button>
                {selectedTests.length > 0 && (
                  <>
                    {selectedTests.slice(0, 3).map(test => (
                      <span
                        key={test}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {test}
                      </span>
                    ))}
                    {selectedTests.length > 3 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTestListOpen(true);
                        }}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
                      >
                        +{selectedTests.length - 3} more ▼
                      </button>
                    )}
                  </>
                )}
              </div>
              {testsOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto transition-all duration-200 ease-in-out transform origin-top scale-y-100">
                  <label className="flex items-center px-3 py-2 hover:bg-gray-100">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedTests.length === Object.keys(REQUIRED_HEADERS_BY_TEST).length}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (selectedTests.length === Object.keys(REQUIRED_HEADERS_BY_TEST).length) setSelectedTests([]);
                        else setSelectedTests(Object.keys(REQUIRED_HEADERS_BY_TEST));
                        setRawHeaders([]);
                        setSuggestedMap({});
                        setColumnMap({});
                        setEnrichedData({});
                        setErrorMessage(null);
                      }}
                    />
                    Select All Tests
                  </label>
                  {Object.keys(REQUIRED_HEADERS_BY_TEST).map(test => (
                    <label key={test} className="flex items-center px-3 py-2 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedTests.includes(test)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedTests(prev => prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]);
                          setRawHeaders([]);
                          setSuggestedMap({});
                          setColumnMap({});
                          setEnrichedData({});
                          setErrorMessage(null);
                        }}
                      />
                      {test}
                    </label>
                  ))}
                </div>
              )}
              {isTestListOpen && selectedTests.length > 3 && (
                <div className="absolute z-10 mt-2 w-64 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {selectedTests.map(test => (
                    <div key={test} className="flex items-center px-3 py-2 text-sm text-gray-800">
                      <span className="mr-2">●</span>
                      {test}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Plan Year, Preview, and Download */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <select
                value={planYear}
                onChange={e => setPlanYear(e.target.value)}
                className="w-full sm:w-40 px-3 py-1 rounded text-blue-600 border border-blue-600 hover:bg-blue-50 plan-year-select"
              >
                <option value="">-- Plan Year --</option>
                {Array.from({ length: 10 }, (_, i) => 2016 + i).reverse().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="flex gap-4">
                <button
                  onClick={handlePreview}
                  disabled={!originalRows.length || !planYear}
                  className={`px-4 py-2 rounded text-white ${originalRows.length && planYear ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"} preview-data-button`}
                >
                  Preview Data
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
            {/* Upload & Map */}
            <div className="file-uploader">
              <FileUploader onParse={handleParse} error={errorMessage} setError={setErrorMessage} />
            </div>
            <div className="header-mapper">
              {rawHeaders.length > 0 ? (
                <HeaderMapper
                  rawHeaders={rawHeaders}
                  requiredHeaders={requiredHeaders}
                  columnMap={columnMap}
                  setColumnMap={setColumnMap}
                  mandatoryHeaders={mandatoryHeaders}
                  autoGenerateHCE={!!columnMap.autoHCE}
                  canAutoGenerateHCE={() => !!columnMap.Compensation}
                  autoGenerateKeyEmployee={!!columnMap.autoKey}
                  canAutoGenerateKeyEmployee={() => !!columnMap.Compensation && !!columnMap["Ownership %"] && !!columnMap["Family Member"] && !!columnMap["Employment Status"]}
                  suggestedMap={suggestedMap}
                />
              ) : (
                <div className="p-4 border rounded bg-white text-blue-600 text-lg text-center">
                  Upload a CSV file to map headers.
                </div>
              )}
            </div>
            {/* Preview or Summaries */}
            {selectedTests.length === 1 && enrichedData[selectedTests[0]] && (
              <EnrichedTable
                filteredRows={rowsWithMetrics}
                summaryCounts={enrichedData[selectedTests[0]].summary}
                formatCurrency={v => isNaN(Number(v)) ? "N/A" : Number(v).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                formatPct={v => isNaN(Number(v)) ? "N/A" : `${v.toFixed(2)}%`}
                className="enriched-table"
              />
            )}
            {selectedTests.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 multi-test-preview">
                {selectedTests.map(test => {
                  const record = enrichedData[test] || {};
                  const { summary = {}, error } = record;
                  const total = getSummaryValue(summary, "total_employees", "Total Employees");
                  const eligible = getSummaryValue(summary, "total_eligible", "Total Eligible Employees");
                  const participating = getSummaryValue(summary, "total_participating", "Total Participants");
                  const keyEmps = getSummaryValue(summary, "total_key_employees", "Total Key Employees");
                  return (
                    <div key={test} className="p-4 border rounded bg-white shadow">
                      <h2 className="text-lg font-semibold mb-2">{test}</h2>
                      {error ? <p className="text-red-600">Error: {error}</p> : <>
                        <p><strong>Total:</strong> {total}</p>
                        <p><strong>Eligible:</strong> {eligible}</p>
                        {(test === "ADP Test" || test === "ACP Test") && <p><strong>Participating:</strong> {participating}</p>}
                        {(test === "Top Heavy Test") && <p><strong>Key Employees:</strong> {keyEmps}</p>}
                      </>}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Error */}
            {errorMessage && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded error-message">{errorMessage}</div>}
            {/* Modals */}
            {showDownloadConfirm && (
              <ConfirmModal
                title="Confirm Download"
                message="Proceed?"
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
                message={`Would you like to navigate to the ${selectedTests[0]} page?`}
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
