// src/components/CSVBuilderWizard.jsx

import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { getAuth } from "firebase/auth";

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

const KEY_EMPLOYEE_THRESHOLDS = {
  2010: 160000, 2011: 160000, 2012: 165000, 2013: 165000, 2014: 170000,
  2015: 170000, 2016: 170000, 2017: 175000, 2018: 175000, 2019: 180000,
  2020: 185000, 2021: 185000, 2022: 200000, 2023: 200000, 2024: 215000,
  2025: 220000
};

const REQUIRED_HEADERS_BY_TEST = {
  "ADP Test": [
    "Employee ID", "First Name", "Last Name", "DOB", "DOH", "Plan Entry Date",
    "Termination Date", "Employment Status", "Excluded from Test", "Union Employee", "Part-Time / Seasonal",
    "Hours Worked", "Compensation", "Employee Deferral", "Deferral Election %", "Ownership %", "Family Relationship",
  ],
  "ACP Test": [
    "Last Name", "First Name", "Employee ID", "Compensation", "Employer Match",
    "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test",
    "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"
  ],
  "Top Heavy Test": [
    "Last Name", "First Name", "Employee ID", "Plan Assets", "Compensation", "Key Employee",
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
  ],
  "Cafeteria Eligibility Test": [
    "Last Name", "First Name", "Employee ID", "DOB", "DOH", "Employment Status",
    "Excluded from Test", "Union Employee", "Part-Time / Seasonal"
  ],
  "Cafeteria Contributions and Benefits Test": [
    "Last Name", "First Name", "Employee ID", "Compensation", "DOB", "DOH", "Employment Status",
    "Excluded from Test", "Union Employee", "Part-Time / Seasonal"
  ],
  "Cafeteria Key Employee Test": [
    "Last Name", "First Name", "Employee ID", "Compensation", "Key Employee",
    "DOB", "DOH", "Employment Status", "Excluded from Test"
  ],
  "DCAP Eligibility Test": [
    "Last Name", "First Name", "Employee ID", "DOB", "DOH", "Employment Status",
    "Excluded from Test", "Union Employee", "Part-Time / Seasonal"
  ],
  "DCAP 55% Average Benefits Test": [
    "Last Name", "First Name", "Employee ID", "Compensation", "HCE",
    "DOB", "DOH", "Employment Status", "Excluded from Test"
  ],
  "DCAP Concentration Test": [
    "Last Name", "First Name", "Employee ID", "Compensation", "Key Employee",
    "DOB", "DOH", "Employment Status", "Excluded from Test"
  ]
};

export default function CSVBuilderWizard() {
  const [rawHeaders, setRawHeaders] = useState([]);
  const [selectedTest, setSelectedTest] = useState("");
  const [columnMap, setColumnMap] = useState({});
  const [planYear, setPlanYear] = useState("");
  const [autoGenerateHCE, setAutoGenerateHCE] = useState(false);
  const [autoGenerateKeyEmployee, setAutoGenerateKeyEmployee] = useState(false);
  const [originalRows, setOriginalRows] = useState([]);
  const [savedMappings, setSavedMappings] = useState(() => {
    const saved = localStorage.getItem("csvColumnMappings");
    return saved ? JSON.parse(saved) : {};
  });
  const [showModal, setShowModal] = useState(false);
  const [nextRoute, setNextRoute] = useState(null);
  const [enrichedRows, setEnrichedRows] = useState([]);
  const [summaryCounts, setSummaryCounts] = useState({
    total_employees: 0,
    total_eligible: 0,
    total_excluded: 0,
    total_hces: 0,
    total_participating: 0
  });
  const [showExcludedOnly, setShowExcludedOnly] = useState(false);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [showParticipatingOnly, setShowParticipatingOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const requiredHeaders = REQUIRED_HEADERS_BY_TEST[selectedTest] || [];

  // Utility functions for formatting
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "N/A";
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "N/A";
    return `${Number(value).toFixed(2)}%`;
  };

  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  // Map test names to backend test types
  const TEST_TYPE_MAP = {
    "ADP Test": "adp",
    "ACP Test": "acp",
    "Top Heavy Test": "top_heavy",
    "Average Benefit Test": "average_benefit",
    "Coverage Test": "coverage",
    "Cafeteria Eligibility Test": "simple_cafeteria_plan_eligibility",
    "Cafeteria Contributions and Benefits Test": "cafeteria_contributions_benefits",
    "Cafeteria Key Employee Test": "key_employee",
    "DCAP Eligibility Test": "dcap_eligibility",
    "DCAP 55% Average Benefits Test": "dcap_55_benefits",
    "DCAP Concentration Test": "dcap_key_employee_concentration"
  };

  // Check if required columns for auto-generating HCE are mapped
  const canAutoGenerateHCE = () => {
    if (!requiredHeaders.includes("HCE")) return false;
    const requiredColumns = ["Compensation"];
    return requiredColumns.every(col => columnMap[col]);
  };

  // Check if required columns for auto-generating Key Employee are mapped
  const canAutoGenerateKeyEmployee = () => {
    if (selectedTest !== "Top Heavy Test" && selectedTest !== "Average Benefit Test") return false;
    const requiredColumns = ["Compensation", "Ownership %", "Family Member", "Employment Status"];
    return requiredColumns.every(col => columnMap[col]);
  };

  const handleCSVUpload = async (parsedCsvRows, planYear) => {
    try {
      setErrorMessage(null);
      const testType = TEST_TYPE_MAP[selectedTest];
      if (!testType) {
        throw new Error("Unsupported test type for preview");
      }

      const csvContent = Papa.unparse(parsedCsvRows);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const csvFile = new File([blob], "temp.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("test_type", testType);
      formData.append("plan_year", planYear);

      const auth = getAuth();
      const token = await (auth.currentUser ? auth.currentUser.getIdToken(true) : null);
      if (!token) {
        throw new Error("No valid Firebase token found. Are you logged in?");
      }

      const response = await axios.post(`${API_URL}/preview-csv`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Backend preview response:", response.data);

      if (response.data.employees.length === 0) {
        setErrorMessage("No employees were processed. Please check your CSV data (e.g., Employment Status, Plan Entry Date) to ensure employees meet eligibility criteria.");
      }

      setEnrichedRows(response.data.employees);
      setSummaryCounts({
        total_employees: response.data.summary.total_employees,
        total_eligible: response.data.summary.total_eligible,
        total_excluded: response.data.summary.total_excluded,
        total_hces: response.data.summary.total_key_employees || response.data.summary.total_hces || 0,
        total_participating: response.data.summary.total_participants || response.data.summary.total_participating || 0
      });
    } catch (error) {
      console.error("❌ Error during preview:", error);
      setErrorMessage(error.response?.data?.detail || error.message || "An error occurred while processing the CSV.");
      setEnrichedRows([]);
      setSummaryCounts({
        total_employees: 0,
        total_eligible: 0,
        total_excluded: 0,
        total_hces: 0,
        total_participating: 0
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: function (results) {
        const headers = results.meta.fields;
        setRawHeaders(headers);
        setOriginalRows(results.data);

        const normalizedRaw = headers.map(h => ({ original: h, normalized: normalize(h) }));
        const autoMap = {};

        REQUIRED_HEADERS_BY_TEST[selectedTest]?.forEach((required) => {
          const match = normalizedRaw.find(col => normalize(required) === col.normalized);
          if (match) autoMap[required] = match.original;
        });

        setColumnMap(autoMap);
        handleCSVUpload(results.data, planYear);
      },
    });
  };

  const handleSelectChange = (requiredHeader, selectedValue) => {
    const updatedMap = { ...columnMap, [requiredHeader]: selectedValue };
    setColumnMap(updatedMap);
  };

  const isDownloadEnabled = () => {
    return requiredHeaders.every(header => 
      columnMap[header] || 
      (header === "HCE" && autoGenerateHCE && canAutoGenerateHCE()) || 
      (header === "Key Employee" && autoGenerateKeyEmployee && canAutoGenerateKeyEmployee())
    );
  };

  const handleDownload = () => {
    const unmapped = requiredHeaders.filter(
      header => !columnMap[header] && 
      !(header === "HCE" && autoGenerateHCE && canAutoGenerateHCE()) && 
      !(header === "Key Employee" && autoGenerateKeyEmployee && canAutoGenerateKeyEmployee())
    );
    if (unmapped.length > 0) {
      alert(`Please map all required fields before downloading.\nUnmapped: ${unmapped.join(", ")}`);
      return;
    }

    const mappedRows = originalRows.map(row => {
      const newRow = {};
      requiredHeaders.forEach(header => {
        if (columnMap[header]) {
          newRow[header] = row[columnMap[header]] ?? "";
        } else if (header === "HCE" && autoGenerateHCE && canAutoGenerateHCE()) {
          const comp = parseFloat(row[columnMap["Compensation"]] ?? 0);
          const threshold = HCE_THRESHOLDS[parseInt(planYear)] ?? 155000;
         //  newRow["HCE"] = comp >= threshold ? "Yes" : "No";
        } else if (header === "Key Employee" && autoGenerateKeyEmployee && canAutoGenerateKeyEmployee()) {
          const comp = parseFloat(row[columnMap["Compensation"]] ?? 0);
          const ownership = parseFloat(row[columnMap["Ownership %"]] ?? 0);
          const familyMember = (row[columnMap["Family Member"]] ?? "").toLowerCase();
          const employmentStatus = (row[columnMap["Employment Status"]] ?? "").toLowerCase();
          const threshold = KEY_EMPLOYEE_THRESHOLDS[parseInt(planYear)] ?? 220000;
          const isKeyEmployee = (
            (comp >= threshold && employmentStatus === "officer") ||
            (ownership >= 5) ||
            (ownership >= 1 && comp > 150000) ||
            (["spouse", "child", "parent", "grandparent"].includes(familyMember))
          );
          newRow["Key Employee"] = isKeyEmployee ? "Yes" : "No";
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
      "Cafeteria Eligibility Test": "/test-eligibility",
      "Cafeteria Contributions and Benefits Test": "/test-cafeteria-contributions-benefits",
      "Cafeteria Key Employee Test": "/test-key-employee",
      "DCAP Eligibility Test": "/test-dcap-eligibility",
      "DCAP 55% Average Benefits Test": "/test-dcap-55-benefits",
      "DCAP Concentration Test": "/test-dcap-key-employee-concentration"
    };

    setNextRoute(routeMap[selectedTest]);
    setShowModal(true);
    setSelectedTest("");
  };

  const handleDownloadClick = () => {
    if (!isDownloadEnabled()) return;
    setShowDownloadConfirm(true);
  };

  const confirmDownload = () => {
    setShowDownloadConfirm(false);
    handleDownload();
  };

  const cancelDownload = () => {
    setShowDownloadConfirm(false);
  };

  // Filter and search employees
  const filteredRows = useMemo(() => {
  let filtered = enrichedRows.map(row => {
    const compRaw = row["Compensation"];
    const deferralRaw = row["Employee Deferral"];

    const comp = parseFloat((compRaw ?? "").toString().replace(/[$,]/g, ""));
    const deferral = parseFloat((deferralRaw ?? "").toString().replace(/[$,]/g, ""));

    const deferralPercent =
      !isNaN(comp) && comp > 0 && !isNaN(deferral)
        ? (deferral / comp) * 100
        : undefined;

    return {
      ...row,
      "Deferral Percent": deferralPercent,
      Participating:
        selectedTest === "Top Heavy Test" || selectedTest === "Average Benefit Test"
          ? row.Eligible
          : selectedTest === "Coverage Test"
          ? row["Eligible for Plan"]?.toLowerCase() === "yes"
          : row.Participating,
    };
  });

  if (showExcludedOnly) {
    filtered = filtered.filter(row => !row.Eligible);
  }
  if (showEligibleOnly) {
    filtered = filtered.filter(row => row.Eligible);
  }
  if (showParticipatingOnly) {
    filtered = filtered.filter(row => row.Participating);
  }

  if (searchTerm.trim()) {
    const searchLower = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(row =>
      row["First Name"]?.toLowerCase().includes(searchLower) ||
      row["Last Name"]?.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}, [enrichedRows, showExcludedOnly, showEligibleOnly, showParticipatingOnly, searchTerm, selectedTest]);


  // Download enriched employee data as CSV (test-specific adjustments)
  const downloadEnrichedEmployeeCSV = () => {
    const isACPTest = selectedTest === "ACP Test";
    const isTopHeavyTest = selectedTest === "Top Heavy Test";
    const isAverageBenefitTest = selectedTest === "Average Benefit Test";
    const isCoverageTest = selectedTest === "Coverage Test";
    const contributionHeader = isACPTest ? "Employer Match" : (isTopHeavyTest || isAverageBenefitTest) ? "Plan Assets" : (isCoverageTest ? "" : "Employee Deferral");
    const percentageHeader = isACPTest ? "Contribution %" : isAverageBenefitTest ? "Benefit %" : (isTopHeavyTest || isCoverageTest ? "" : "Deferral %");
    const csvHeaders = [
      "Employee ID",
      "Name",
      "Status",
      "HCE",
      ...(isTopHeavyTest || isAverageBenefitTest ? ["Key Employee"] : []),
      "Age",
      ...(isCoverageTest ? [] : ["Compensation"]),
      ...(contributionHeader ? [contributionHeader] : []),
      "Years of Service",
      ...(percentageHeader ? [percentageHeader] : []),
      "Participating",
      "Enrollment Status",
      "Exclusion Reason"
    ].filter(header => header);

    const csvRows = [
      csvHeaders,
      ...filteredRows.map(row => {
        const rowData = [
          row["Employee ID"],
          `${row["First Name"]} ${row["Last Name"]}`,
          row.Eligible ? "Eligible" : "Excluded",
          row.HCE === "yes" ? "Yes" : "No",
        ];
        if (isTopHeavyTest || isAverageBenefitTest) {
          rowData.push(row["Key Employee"] === "yes" ? "Yes" : "No");
        }
        rowData.push(row.Age);
        if (!isCoverageTest) {
          rowData.push(formatCurrency(row["Compensation"] || 0));
          rowData.push(formatCurrency(isACPTest ? row["Employer Match"] : (isTopHeavyTest || isAverageBenefitTest) ? row["Adjusted Plan Assets"] || row["Plan Assets"] : row["Employee Deferral"]));
        }
        rowData.push(
          row["Years of Service"]
        );
        if (percentageHeader) {
          rowData.push(formatPercentage(isACPTest ? row["Contribution Percentage"] : isAverageBenefitTest ? row["Benefit Percentage"] : row["Deferral Percent"]));
        }
        rowData.push(
          row.Participating ? "Yes" : "No",
          row.Participating ? "Participating" : row.Eligible ? "Not Participating" : "Not Eligible",
          row["Exclusion Reason"]
        );
        return rowData;
      })
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Enriched_Employee_Data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download enriched employee data as PDF (test-specific adjustments)
  const downloadEnrichedEmployeePDF = () => {
    const isACPTest = selectedTest === "ACP Test";
    const isTopHeavyTest = selectedTest === "Top Heavy Test";
    const isAverageBenefitTest = selectedTest === "Average Benefit Test";
    const isCoverageTest = selectedTest === "Coverage Test";
    const contributionHeader = isACPTest ? "Employer Match" : (isTopHeavyTest || isAverageBenefitTest) ? "Plan Assets" : (isCoverageTest ? "" : "Employee Deferral");
    const percentageHeader = isACPTest ? "Contribution %" : isAverageBenefitTest ? "Benefit %" : (isTopHeavyTest || isCoverageTest ? "" : "Deferral %");
    const pdf = new jsPDF("l", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Enriched Employee Preview", 148.5, 15, { align: "center" });

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Total: ${summaryCounts.total_employees}  Eligible: ${summaryCounts.total_eligible}  Excluded: ${summaryCounts.total_excluded}  HCEs: ${summaryCounts.total_hces}  Participating: ${summaryCounts.total_participating}`, 148.5, 25, { align: "center" });

    const tableColumns = [
      "Employee ID",
      "Name",
      "Status",
      "HCE",
      ...(isTopHeavyTest || isAverageBenefitTest ? ["Key Employee"] : []),
      "Age",
      ...(isCoverageTest ? [] : ["Compensation"]),
      ...(contributionHeader ? [contributionHeader] : []),
      "Years of Service",
      ...(percentageHeader ? [percentageHeader] : []),
      "Participating",
      "Enrollment Status",
      "Exclusion Reason"
    ].filter(header => header);

    const tableRows = filteredRows.map(row => {
      const rowData = [
        row["Employee ID"],
        `${row["First Name"]} ${row["Last Name"]}`,
        row.Eligible ? "Eligible" : "Excluded",
        row.HCE === "yes" ? "Yes" : "No",
      ];
      if (isTopHeavyTest || isAverageBenefitTest) {
        rowData.push(row["Key Employee"] === "yes" ? "Yes" : "No");
      }
      rowData.push(row.Age);
      if (!isCoverageTest) {
        rowData.push(formatCurrency(row["Compensation"] || 0));
        rowData.push(formatCurrency(isACPTest ? row["Employer Match"] : (isTopHeavyTest || isAverageBenefitTest) ? row["Adjusted Plan Assets"] || row["Plan Assets"] : row["Employee Deferral"]));
      }
      rowData.push(row["Years of Service"]);
      if (percentageHeader) {
        rowData.push(formatPercentage(isACPTest ? row["Contribution Percentage"] : isAverageBenefitTest ? row["Benefit Percentage"] : row["Deferral Percent"]));
      }
      rowData.push(
        row.Participating ? "Yes" : "No",
        row.Participating ? "Participating" : row.Eligible ? "Not Participating" : "Not Eligible",
        row["Exclusion Reason"]
      );
      return rowData;
    });

    pdf.autoTable({
      startY: 35,
      theme: "grid",
      head: [tableColumns],
      body: tableRows,
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      styles: { fontSize: 8, font: "helvetica" },
      margin: { left: 10, right: 10 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15 },
        ...(isTopHeavyTest || isAverageBenefitTest ? {
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 30 },
          7: { cellWidth: 30 },
          8: { cellWidth: 20 },
          9: { cellWidth: 20 },
          10: { cellWidth: 25 },
          11: { cellWidth: 30 }
        } : isCoverageTest ? {
          4: { cellWidth: 15 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 25 },
          8: { cellWidth: 30 }
        } : {
          4: { cellWidth: 15 },
          5: { cellWidth: 30 },
          6: { cellWidth: 30 },
          7: { cellWidth: 20 },
          8: { cellWidth: 20 },
          9: { cellWidth: 20 },
          10: { cellWidth: 25 },
          11: { cellWidth: 30 }
        })
      },
    });

    pdf.save("Enriched_Employee_Data.pdf");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Pre-Test Data Processor</h1>

      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 mb-6">
        <div className="flex gap-4">
          <select value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)} className="border border-gray-300 rounded px-3 py-2 w-64">
            <option value="">-- Choose a Test --</option>
            {Object.keys(REQUIRED_HEADERS_BY_TEST).map(test => <option key={test} value={test}>{test}</option>)}
          </select>

          <select value={planYear} onChange={(e) => setPlanYear(e.target.value)} className="border border-gray-300 rounded px-3 py-2 w-40">
            <option value="">-- Plan Year --</option>
            {Array.from({ length: 20 }, (_, i) => 2010 + i).reverse().map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        <button
          onClick={handleDownloadClick}
          disabled={!isDownloadEnabled()}
          className={`px-4 py-2 rounded text-white ${isDownloadEnabled() ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
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
              onChange={(e) => setAutoGenerateHCE(e.target.checked)}
              disabled={!canAutoGenerateHCE()}
            />
            HCE column missing. Auto-generate HCE from compensation + plan year?
          </label>
          {!canAutoGenerateHCE() && (
            <p className="text-red-600 text-xs mt-1">
              Required column missing: Compensation must be mapped to auto-generate HCE.
            </p>
          )}
        </div>
      )}

      {(selectedTest === "Top Heavy Test" || selectedTest === "Average Benefit Test") && requiredHeaders.includes("Key Employee") && !columnMap["Key Employee"] && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-sm rounded">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoGenerateKeyEmployee}
              onChange={(e) => setAutoGenerateKeyEmployee(e.target.checked)}
              disabled={!canAutoGenerateKeyEmployee()}
            />
            Key Employee column missing. Auto-generate Key Employee from compensation, ownership, family relationship, and employment status?
          </label>
          {!canAutoGenerateKeyEmployee() && (
            <p className="text-red-600 text-xs mt-1">
              Required columns missing: Compensation, Ownership %, Family Member, Employment Status must be mapped to auto-generate Key Employee.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {requiredHeaders.map(header => (
          <React.Fragment key={header}>
            <div className="bg-gray-100 px-4 py-2 rounded-md font-medium flex items-center h-10">
              <span className="text-red-500 mr-1">*</span>
              {header}
            </div>
            <select value={columnMap[header] || ""} onChange={(e) => handleSelectChange(header, e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 h-10">
              <option value="">-- Select Column --</option>
              {rawHeaders.map(raw => <option key={raw} value={raw}>{raw}</option>)}
            </select>
          </React.Fragment>
        ))}
      </div>

      {errorMessage && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Enriched Employee Preview */}
      {enrichedRows.length > 0 && !errorMessage && (
        <div className="flex justify-center">
          <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-md w-[1400px]">
            <h4 className="font-bold text-lg text-gray-700 mb-2">
              Enriched Employee Preview
            </h4>
            <div className="mb-4 flex justify-between items-center">
              <p className="flex gap-4">
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

            {/* Exclusion & Filter Controls */}
            <div className="mb-4 flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showExcludedOnly}
                  onChange={(e) => {
                    setShowExcludedOnly(e.target.checked);
                    if (e.target.checked) {
                      setShowEligibleOnly(false);
                      setShowParticipatingOnly(false);
                    }
                  }}
                  className="mr-2"
                />
                Show Excluded Only
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showEligibleOnly}
                  onChange={(e) => {
                    setShowEligibleOnly(e.target.checked);
                    if (e.target.checked) {
                      setShowExcludedOnly(false);
                      setShowParticipatingOnly(false);
                    }
                  }}
                  className="mr-2"
                />
                Show Eligible Only
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showParticipatingOnly}
                  onChange={(e) => {
                    setShowParticipatingOnly(e.target.checked);
                    if (e.target.checked) {
                      setShowExcludedOnly(false);
                      setShowEligibleOnly(false);
                    }
                  }}
                  className="mr-2"
                />
                Show Participating Only
              </label>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>


            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="bg-white border border-gray-200 w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "80px" }}>
                      Employee ID
                    </th>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "150px" }}>
                      Name
                    </th>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "80px" }}>
                      Status
                    </th>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "50px" }}>
                      HCE
                    </th>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "50px" }}>
                      Age
                    </th>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "120px" }}>
                      Compensation
                    </th>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "120px" }}>
                      Employee Deferral
                    </th>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "80px" }}>
                      Years of Service
                    </th>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "80px" }}>
                      Deferral %
                    </th>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "80px" }}>
                      Participating
                    </th>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "120px" }}>
                      Enrollment Status
                    </th>
                    <th className="px-4 py-2 border-b" style={{ minWidth: "150px" }}>
                      Exclusion Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, index) => (
                    <tr
                      key={index}
                      className={`text-center ${row.Eligible ? "bg-green-50" : "bg-red-50"}`}
                    >
                      <td className="px-4 py-2 border-b">{row["Employee ID"]}</td>
                      <td className="px-4 py-2 border-b">
                        {`${row["First Name"]} ${row["Last Name"]}`}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {row.Eligible ? "Eligible" : "Excluded"}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {row.HCE === "yes" ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-2 border-b">{row.Age}</td>
                      <td className="px-4 py-2 border-b">
                        {formatCurrency(row["Compensation"])}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {formatCurrency(row["Employee Deferral"])}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {row["Years of Service"]}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {formatPercentage(row["Deferral Percent"])}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {row.Participating ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {row.Participating
                          ? "Participating"
                          : row.Eligible
                          ? "Not Participating"
                          : "Not Eligible"}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {row["Exclusion Reason"]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Popup for Download */}
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

      {/* Modal for Post-Download Navigation */}
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
