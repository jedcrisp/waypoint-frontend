// src/components/CSVBuilderWizard.jsx

import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import { getAuth } from "firebase/auth";

const HCE_THRESHOLDS = {
  2016: 120000, 2017: 120000, 2018: 120000, 2019: 120000,
  2020: 125000, 2021: 130000, 2022: 130000, 2023: 135000,
  2024: 150000, 2025: 155000,
};

const KEY_EMPLOYEE_THRESHOLDS = {
  2010: 160000, 2011: 160000, 2012: 165000, 2013: 165000, 2014: 170000,
  2015: 170000, 2016: 170000, 2017: 175000, 2018: 175000, 2019: 180000,
  2020: 185000, 2021: 185000, 2022: 200000, 2023: 200000, 2024: 215000,
  2025: 220000,
};

const REQUIRED_HEADERS_BY_TEST = {
  "ADP Test": [
    "Employee ID", "First Name", "Last Name", "DOB", "DOH", "Plan Entry Date",
    "Termination Date", "Employment Status", "Excluded from Test", "Union Employee",
    "Part-Time / Seasonal", "Hours Worked", "Compensation", "Employee Deferral",
    "Deferral Election %", "Ownership %", "Family Relationship", "HCE",
  ],
  "ACP Test": [
    "Last Name", "First Name", "Employee ID", "Compensation", "Employer Match",
    "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test",
    "Plan Entry Date", "Union Employee", "Part-Time / Seasonal",
  ],
  "Top Heavy Test": [
    "Last Name", "First Name", "Employee ID", "Plan Assets", "Compensation",
    "Key Employee", "Ownership %", "Family Member", "DOB", "DOH",
    "Excluded from Test", "Employment Status",
  ],
  "Average Benefit Test": [
    "Last Name", "First Name", "Employee ID", "DOB", "DOH", "Employment Status",
    "Excluded from Test", "Union Employee", "Part-Time / Seasonal",
    "Plan Entry Date", "Plan Assets", "Key Employee",
  ],
  "Coverage Test": [
    "Last Name", "First Name", "Employee ID", "Eligible for Plan", "HCE",
    "DOB", "DOH", "Employment Status", "Excluded from Test",
    "Union Employee", "Part-Time / Seasonal", "Plan Entry Date",
  ],
  // add other tests as needed...
};

export default function CSVBuilderWizard() {
  const [rawHeaders, setRawHeaders] = useState([]);
  const [selectedTest, setSelectedTest] = useState("");
  const [planYear, setPlanYear] = useState("");
  const [columnMap, setColumnMap] = useState({});
  const [autoGenerateHCE, setAutoGenerateHCE] = useState(false);
  const [autoGenerateKeyEmployee, setAutoGenerateKeyEmployee] = useState(false);
  const [originalRows, setOriginalRows] = useState([]);
  const [enrichedRows, setEnrichedRows] = useState([]);
  const [summaryCounts, setSummaryCounts] = useState({
    total_employees: 0,
    total_eligible: 0,
    total_excluded: 0,
    total_hces: 0,
    total_participating: 0,
  });
  const [showExcludedOnly, setShowExcludedOnly] = useState(false);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [showParticipatingOnly, setShowParticipatingOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nextRoute, setNextRoute] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const requiredHeaders = REQUIRED_HEADERS_BY_TEST[selectedTest] || [];
  const mandatoryHeaders = requiredHeaders.filter(h => h !== "HCE");

  const normalize = str =>
    (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  const TEST_TYPE_MAP = {
    "ADP Test": "adp",
    "ACP Test": "acp",
    "Top Heavy Test": "top_heavy",
    "Average Benefit Test": "average_benefit",
    "Coverage Test": "coverage",
    // other mappings...
  };

  const canAutoGenerateHCE = () =>
    requiredHeaders.includes("HCE") && !!columnMap["Compensation"];

  const canAutoGenerateKeyEmployee = () => {
    if (!["Top Heavy Test", "Average Benefit Test"].includes(selectedTest))
      return false;
    return ["Compensation", "Ownership %", "Family Member", "Employment Status"].every(
      col => columnMap[col]
    );
  };

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: ({ data, meta }) => {
        setRawHeaders(meta.fields);
        setOriginalRows(data);
        // auto-map exact matches
        const normalized = meta.fields.map(f => ({
          original: f,
          norm: normalize(f),
        }));
        const autoMap = {};
        requiredHeaders.forEach(req => {
          const m = normalized.find(c => normalize(req) === c.norm);
          if (m) autoMap[req] = m.original;
        });
        setColumnMap(autoMap);
        previewCsv(data);
      },
      error: console.error,
    });
  }

  async function previewCsv(rows) {
    try {
      setErrorMessage(null);
      const testType = TEST_TYPE_MAP[selectedTest];
      if (!testType) throw new Error("Unsupported test type");
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv" });
      const form = new FormData();
      form.append("file", new File([blob], "temp.csv"));
      form.append("test_type", testType);
      form.append("plan_year", planYear);
      const token = await getAuth().currentUser?.getIdToken(true);
      if (!token) throw new Error("Not authenticated");
      const { data } = await axios.post(`${API_URL}/preview-csv`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrichedRows(data.employees);
      setSummaryCounts({
        total_employees: data.summary.total_employees,
        total_eligible: data.summary.total_eligible,
        total_excluded: data.summary.total_excluded,
        total_hces: data.summary.total_key_employees ?? data.summary.total_hces,
        total_participating:
          data.summary.total_participants ?? data.summary.total_participating,
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || err.message);
      setEnrichedRows([]);
      setSummaryCounts({
        total_employees: 0,
        total_eligible: 0,
        total_excluded: 0,
        total_hces: 0,
        total_participating: 0,
      });
    }
  }

  function handleSelectChange(header, col) {
    setColumnMap(m => ({ ...m, [header]: col }));
  }

  const isDownloadEnabled = () =>
    mandatoryHeaders.every(
      h =>
        columnMap[h] ||
        (h === "Key Employee" &&
          autoGenerateKeyEmployee &&
          canAutoGenerateKeyEmployee())
    );

  function handleDownloadClick() {
    if (!isDownloadEnabled()) return;
    setShowDownloadConfirm(true);
  }

  function confirmDownload() {
    setShowDownloadConfirm(false);
    doDownload();
  }

  function cancelDownload() {
    setShowDownloadConfirm(false);
  }

  function doDownload() {
    const unmapped = mandatoryHeaders.filter(
      h =>
        !columnMap[h] &&
        !(
          h === "Key Employee" &&
          autoGenerateKeyEmployee &&
          canAutoGenerateKeyEmployee()
        )
    );
    if (unmapped.length) {
      return alert(`Please map: ${unmapped.join(", ")}`);
    }
    // build mapped rows
    const mapped = originalRows.map(r => {
      const out = {};
      requiredHeaders.forEach(h => {
        if (columnMap[h]) out[h] = r[columnMap[h]] ?? "";
        else if (h === "HCE" && autoGenerateHCE && canAutoGenerateHCE()) {
          out.HCE =
            parseFloat(r[columnMap.Compensation] || 0) >=
            (HCE_THRESHOLDS[+planYear] || 0)
              ? "Yes"
              : "No";
        } else if (
          h === "Key Employee" &&
          autoGenerateKeyEmployee &&
          canAutoGenerateKeyEmployee()
        ) {
          const comp = parseFloat(r[columnMap.Compensation] || 0);
          const own = parseFloat(r[columnMap["Ownership %"]] || 0);
          const fam = (r[columnMap["Family Member"]] || "").toLowerCase();
          const emp = (r[columnMap["Employment Status"]] || "").toLowerCase();
          const thr = KEY_EMPLOYEE_THRESHOLDS[+planYear] || Infinity;
          const isKey =
            (comp >= thr && emp === "officer") ||
            own >= 5 ||
            (own >= 1 && comp > 150000) ||
            ["spouse", "child", "parent", "grandparent"].includes(fam);
          out["Key Employee"] = isKey ? "Yes" : "No";
        } else {
          out[h] = "";
        }
      });
      return out;
    });
    const csv = Papa.unparse(mapped);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedTest.replace(/\s+/g, "_")}_Mapped.csv`;
    a.click();
    setNextRoute({
      "ADP Test": "/test-adp",
      "ACP Test": "/test-acp",
      "Top Heavy Test": "/test-top-heavy",
      "Average Benefit Test": "/test-average-benefit",
      "Coverage Test": "/test-coverage",
    }[selectedTest]);
    setShowModal(true);
    setSelectedTest("");
  }

  // prepare preview table rows
  const filteredRows = useMemo(() => {
    let out = enrichedRows.map(r => {
      const comp = parseFloat((r.Compensation || "").replace(/[$,]/g, "")) || 0;
      const def = parseFloat((r["Employee Deferral"] || "").replace(/[$,]/g, "")) || 0;
      return {
        ...r,
        "Deferral %": comp > 0 ? (def / comp) * 100 : 0,
        Participating:
          ["Top Heavy Test", "Average Benefit Test"].includes(selectedTest)
            ? r.Eligible
            : selectedTest === "Coverage Test"
            ? r["Eligible for Plan"]?.toLowerCase() === "yes"
            : r.Participating,
      };
    });
    if (showExcludedOnly) out = out.filter(x => !x.Eligible);
    if (showEligibleOnly) out = out.filter(x => x.Eligible);
    if (showParticipatingOnly) out = out.filter(x => x.Participating);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      out = out.filter(
        x =>
          x["First Name"]?.toLowerCase().includes(q) ||
          x["Last Name"]?.toLowerCase().includes(q)
      );
    }
    return out;
  }, [
    enrichedRows,
    showExcludedOnly,
    showEligibleOnly,
    showParticipatingOnly,
    searchTerm,
    selectedTest,
  ]);

  const formatCurrency = v =>
    isNaN(Number(v))
      ? "N/A"
      : Number(v).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const formatPct = v => (isNaN(Number(v)) ? "N/A" : `${v.toFixed(2)}%`);

  function downloadEnrichedEmployeeCSV() {
    const headers = [
      "Employee ID",
      "Name",
      "Status",
      "HCE",
      "Age",
      "Compensation",
      "Employee Deferral",
      "Years of Service",
      "Deferral %",
      "Participating",
      "Enrollment Status",
      "Exclusion Reason",
    ];
    const rows = [
      headers,
      ...filteredRows.map(r => [
        r["Employee ID"],
        `${r["First Name"]} ${r["Last Name"]}`,
        r.Eligible ? "Eligible" : "Excluded",
        r.HCE === "yes" ? "Yes" : "No",
        typeof r.Age === "number" ? r.Age.toFixed(1) : r.Age,
        formatCurrency(r.Compensation),
        formatCurrency(r["Employee Deferral"]),
        typeof r["Years of Service"] === "number"
          ? r["Years of Service"].toFixed(1)
          : r["Years of Service"],
        formatPct(r["Deferral %"]),
        r.Participating ? "Yes" : "No",
        r.Participating
          ? "Participating"
          : r.Eligible
          ? "Not Participating"
          : "Not Eligible",
        r["Exclusion Reason"],
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Enriched_Employee_Data.csv";
    a.click();
  }

  function downloadEnrichedEmployeePDF() {
    const pdf = new jsPDF("l", "mm", "a4");
    pdf.setFontSize(18).text("Enriched Employee Preview", 148.5, 15, { align: "center" });
    pdf.setFontSize(12).text(
      `Total: ${summaryCounts.total_employees}  Eligible: ${summaryCounts.total_eligible}  Excluded: ${summaryCounts.total_excluded}  HCEs: ${summaryCounts.total_hces}  Participating: ${summaryCounts.total_participating}`,
      148.5,
      25,
      { align: "center" }
    );
    const cols = [
      "Employee ID",
      "Name",
      "Status",
      "HCE",
      "Age",
      "Compensation",
      "Employee Deferral",
      "Years of Service",
      "Deferral %",
      "Participating",
      "Enrollment Status",
      "Exclusion Reason",
    ];
    const body = filteredRows.map(r => [
      r["Employee ID"],
      `${r["First Name"]} ${r["Last Name"]}`,
      r.Eligible ? "Eligible" : "Excluded",
      r.HCE === "yes" ? "Yes" : "No",
      typeof r.Age === "number" ? r.Age.toFixed(1) : r.Age,
      formatCurrency(r.Compensation),
      formatCurrency(r["Employee Deferral"]),
      typeof r["Years of Service"] === "number"
        ? r["Years of Service"].toFixed(1)
        : r["Years of Service"],
      formatPct(r["Deferral %"]),
      r.Participating ? "Yes" : "No",
      r.Participating
        ? "Participating"
        : r.Eligible
        ? "Not Participating"
        : "Not Eligible",
      r["Exclusion Reason"],
    ]);
    pdf.autoTable({
      startY: 35,
      head: [cols],
      body,
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      margin: { left: 10, right: 10 },
    });
    pdf.save("Enriched_Employee_Data.pdf");
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Pre-Test Data Processor</h1>

      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 mb-6">
        <div className="flex gap-4">
          <select
            value={selectedTest}
            onChange={e => setSelectedTest(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-64"
          >
            <option value="">-- Choose a Test --</option>
            {Object.keys(REQUIRED_HEADERS_BY_TEST).map(test => (
              <option key={test} value={test}>
                {test}
              </option>
            ))}
          </select>

          <select
            value={planYear}
            onChange={e => setPlanYear(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-40"
          >
            <option value="">-- Plan Year --</option>
            {Array.from({ length: 16 }, (_, i) => 2010 + i)
              .reverse()
              .map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>
        </div>

        <button
          onClick={handleDownloadClick}
          disabled={!isDownloadEnabled()}
          className={`px-4 py-2 rounded text-white ${
            isDownloadEnabled()
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Download Mapped CSV
        </button>
      </div>

      {selectedTest && planYear && (
        <div className="border p-4 rounded-md bg-gray-50 shadow mb-6">
          <input type="file" accept=".csv" onChange={handleFileUpload} />
        </div>
      )}

      {requiredHeaders.includes("HCE") && !columnMap["HCE"] && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-sm rounded">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoGenerateHCE}
              onChange={e => setAutoGenerateHCE(e.target.checked)}
              disabled={!canAutoGenerateHCE()}
            />
            HCE missing: auto-generate from Compensation?
          </label>
          {!canAutoGenerateHCE() && (
            <p className="text-red-600 text-xs mt-1">
              Map Compensation first to enable auto-generation.
            </p>
          )}
        </div>
      )}

      {(selectedTest === "Top Heavy Test" ||
        selectedTest === "Average Benefit Test") &&
        requiredHeaders.includes("Key Employee") &&
        !columnMap["Key Employee"] && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-sm rounded">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoGenerateKeyEmployee}
                onChange={e => setAutoGenerateKeyEmployee(e.target.checked)}
                disabled={!canAutoGenerateKeyEmployee()}
              />
              Key Employee missing: auto-generate from criteria?
            </label>
            {!canAutoGenerateKeyEmployee() && (
              <p className="text-red-600 text-xs mt-1">
                Map Compensation, Ownership %, Family Member, and Employment Status first.
              </p>
            )}
          </div>
        )}

      <div className="grid grid-cols-2 gap-4">
        {requiredHeaders.map(header => (
          <React.Fragment key={header}>
            <div className="bg-gray-100 px-4 py-2 rounded-md font-medium flex items-center h-10">
              {header !== "HCE" && <span className="text-red-500 mr-1">*</span>}
              {header}
            </div>
            <select
              value={columnMap[header] || ""}
              onChange={e => handleSelectChange(header, e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 h-10"
            >
              <option value="">-- Select Column --</option>
              {rawHeaders.map(raw => (
                <option key={raw} value={raw}>
                  {raw}
                </option>
              ))}
            </select>
          </React.Fragment>
        ))}
      </div>

      {errorMessage && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
          {errorMessage}
        </div>
      )}

      {enrichedRows.length > 0 && !errorMessage && (
        <div className="flex justify-center">
          <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-md w-full">
            <h4 className="font-bold text-lg text-gray-700 mb-2">
              Enriched Employee Preview
            </h4>

            <div className="mb-4 flex justify-between items-center">
              <p className="flex gap-4 text-sm">
                <span>
                  <strong>Total:</strong> {summaryCounts.total_employees}
                </span>
                <span>
                  <strong>Eligible:</strong> {summaryCounts.total_eligible}
                </span>
                <span>
                  <strong>Excluded:</strong> {summaryCounts.total_excluded}
                </span>
                <span>
                  <strong>HCEs:</strong> {summaryCounts.total_hces}
                </span>
                <span>
                  <strong>Participating:</strong> {summaryCounts.total_participating}
                </span>
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={downloadEnrichedEmployeeCSV}
                  className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                >
                  Download CSV
                </button>
                <button
                  onClick={downloadEnrichedEmployeePDF}
                  className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                >
                  Download PDF
                </button>
              </div>
            </div>

            <div className="mb-4 flex space-x-4 text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showExcludedOnly}
                  onChange={e => {
                    setShowExcludedOnly(e.target.checked);
                    if (e.target.checked) {
                      setShowEligibleOnly(false);
                      setShowParticipatingOnly(false);
                    }
                  }}
                  className="mr-2"
                />
                Excluded Only
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showEligibleOnly}
                  onChange={e => {
                    setShowEligibleOnly(e.target.checked);
                    if (e.target.checked) {
                      setShowExcludedOnly(false);
                      setShowParticipatingOnly(false);
                    }
                  }}
                  className="mr-2"
                />
                Eligible Only
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showParticipatingOnly}
                  onChange={e => {
                    setShowParticipatingOnly(e.target.checked);
                    if (e.target.checked) {
                      setShowExcludedOnly(false);
                      setShowEligibleOnly(false);
                    }
                  }}
                  className="mr-2"
                />
                Participating Only
              </label>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="ml-4 px-3 py-1 border border-gray-300 rounded-md"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white border border-gray-200 text-sm text-center">
                <thead>
                  <tr>
                    {[
                      "Employee ID",
                      "Name",
                      "Status",
                      "HCE",
                      "Age",
                      "Compensation",
                      "Employee Deferral",
                      "Years of Service",
                      "Deferral %",
                      "Participating",
                      "Enrollment Status",
                      "Exclusion Reason",
                    ].map(th => (
                      <th key={th} className="px-4 py-2 border-b">
                        {th}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r, i) => (
                    <tr
                      key={i}
                      className={`${
                        r.Eligible ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      <td className="px-4 py-2 border-b">{r["Employee ID"]}</td>
                      <td className="px-4 py-2 border-b">
                        {r["First Name"]} {r["Last Name"]}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {r.Eligible ? "Eligible" : "Excluded"}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {r.HCE === "yes" ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {typeof r.Age === "number" ? r.Age.toFixed(1) : r.Age}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {formatCurrency(r.Compensation)}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {formatCurrency(r["Employee Deferral"])}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {typeof r["Years of Service"] === "number"
                          ? r["Years of Service"].toFixed(1)
                          : r["Years of Service"]}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {formatPct(r["Deferral %"])}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {r.Participating ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {r.Participating
                          ? "Participating"
                          : r.Eligible
                          ? "Not Participating"
                          : "Not Eligible"}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {r["Exclusion Reason"]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showDownloadConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-2">Confirm Download</h2>
            <p className="mb-4">
              Are you sure the CSV is accurate and ready for testing?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={cancelDownload}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={confirmDownload}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
