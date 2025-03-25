import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ADPSafeHarborTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // --- Formatting Helpers ---
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "N/A";
    return Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "N/A";
    return `${Number(value).toFixed(2)}%`;
  };

  // --- 1. Drag & Drop Logic ---
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv, .xlsx",
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // --- 2. Upload File ---
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }
    if (!planYear) {
      setError("❌ Please select a plan year.");
      return;
    }
    const validFileTypes = ["csv", "xlsx"];
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!validFileTypes.includes(fileType)) {
      setError("❌ Invalid file type. Please upload a CSV or Excel file.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("selected_tests", "safe_harbor");

    try {
      console.log("🚀 Uploading file to:", `${API_URL}/upload-csv/safe_harbor`);
      console.log("📂 File Selected:", file.name);
      
      // Get Firebase token
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      console.log("Firebase Token:", token);

      // POST request
      const response = await axios.post(`${API_URL}/upload-csv/safe_harbor`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Backend response:", response.data);
      const safeHarborResults = response.data?.["Test Results"]?.["safe_harbor"];
      if (!safeHarborResults) {
        setError("❌ No Safe Harbor test results found in response.");
      } else {
        setResult(safeHarborResults);
      }
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Download CSV Template ---
  const downloadCSVTemplate = () => {
    const csvTemplate = [
  ["Last Name", "First Name", "Employee ID", "Eligible for Cafeteria Plan", "Employer Contribution", "Cafeteria Plan Benefits", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test", "Union Employee", "Part-Time / Seasonal", "Plan Entry Date"],
  ["Last", "First", "E001", "Yes", "1500", "3000", "Yes", "1980-04-12", "2015-06-01", "Active", "No", "No", "No", "2015-07-01"],
  ["Last", "First", "E002", "Yes", "1200", "2800", "No", "1985-11-03", "2019-01-15", "Active", "No", "No", "No", "2019-02-01"],
  ["Last", "First", "E003", "Yes", "1000", "2600", "No", "1990-01-01", "2021-05-01", "Active", "No", "No", "Yes", "2021-05-15"],
  ["Last", "First", "E004", "No", "0", "0", "No", "1992-07-08", "2022-01-10", "Active", "No", "Yes", "No", "2022-02-01"],
  ["Last", "First", "E005", "Yes", "1800", "3200", "Yes", "1979-02-18", "2010-09-20", "Active", "No", "No", "No", "2010-10-01"],
  ["Last", "First", "E006", "Yes", "1100", "2500", "No", "1988-10-23", "2016-03-14", "Active", "No", "No", "No", "2016-04-01"],
  ["Last", "First", "E007", "No", "0", "0", "No", "2001-03-05", "2023-06-01", "Active", "No", "No", "Yes", "2023-06-15"],
  ["Last", "First", "E008", "Yes", "1300", "2700", "Yes", "1982-05-15", "2011-12-01", "Active", "No", "No", "No", "2012-01-01"],
  ["Last", "First", "E009", "Yes", "1400", "2900", "No", "1995-08-09", "2018-07-01", "Active", "No", "Yes", "No", "2018-07-15"],
  ["Last", "First", "E010", "Yes", "1600", "3100", "Yes", "1983-12-30", "2009-05-15", "Active", "No", "No", "No", "2009-06-01"]
]

      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Safe_Harbor_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 4. Export Results to PDF ---
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    // Example metrics (customize as needed)
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const eligibleEmployees = result["Eligible Employees"] ?? "N/A";
    const eligibilityPct = formatPercentage(result["Eligibility Percentage (%)"]);
    const avgEmployerContribution = formatCurrency(result["Average Employer Contribution (%)"]);
    const testRes = result["Test Result"] ?? "N/A";
    const failed = testRes.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Safe Harbor Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${planYear || "N/A"}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

    // Results Table
    pdf.autoTable({
    startY: 40,
    head: [["Metric", "Value"]],
    body: [
      ["Total Employees", totalEmployees],
      ["Eligible Employees", eligibleEmployees],
      ["Eligibility Percentage (%)", eligibilityPct],
      ["Avg Employer Contribution", avgEmployerContribution],
      ["Test Result", testRes],
    ],
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 12,
      font: "helvetica",
      lineColor: [150, 150, 150],  // Medium gray
      lineWidth: 0.2         // Thicker grid lines
    },
    margin: { left: 10, right: 10 },
  });

    // If test failed, add corrective actions & consequences
    if (failed) {
    const correctiveActions = [
      "• Adjust eligibility criteria to improve NHCE participation.",
        "• Modify employer contribution structure to balance benefits.",
        "• Amend plan documents to meet IRS Safe Harbor requirements.",
    ]; 

    const consequences = [
        "• Potential loss of tax benefits if noncompliant.",
        "• IRS penalties and increased audit risk.",
        "• Additional corrective contributions required.",
      ];

      pdf.autoTable({
      startY: pdf.lastAutoTable.finalY + 10,
      theme: "grid",
      head: [["Corrective Actions"]],
      body: correctiveActions.map(action => [action]),
      headStyles: { fillColor: [255, 0, 0], textColor: [255, 255, 255] },
      styles: { fontSize: 11, font: "helvetica" },
      margin: { left: 10, right: 10 },
    });

    pdf.autoTable({
      startY: pdf.lastAutoTable.finalY + 10,
      theme: "grid",
      head: [["Consequences"]],
      body: consequences.map(consequence => [consequence]),
      headStyles: { fillColor: [238, 220, 92], textColor: [255, 255, 255] },
      styles: { fontSize: 11, font: "helvetica" },
      margin: { left: 10, right: 10 },
    });
  }

    pdf.save("Safe_Harbor_Results.pdf");
  };

  // --- 5. Download Results as CSV ---
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    const totalEmployees = result["Total Employees"] ?? "N/A";
    const eligibleEmployees = result["Eligible Employees"] ?? "N/A";
    const eligibilityPct = result["Eligibility Percentage (%)"] !== undefined
      ? result["Eligibility Percentage (%)"] + "%"
      : "N/A";
    const avgEmployerContribution = result["Average Employer Contribution (%)"] ?? "N/A";
    const testRes = result["Test Result"] ?? "N/A";
    const failed = testRes.toLowerCase() === "failed";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      ["Total Employees", totalEmployees],
      ["Eligible Employees", eligibleEmployees],
      ["Eligibility Percentage (%)", eligibilityPct],
      ["Avg Employer Contribution", avgEmployerContribution],
      ["Test Result", testRes],
    ];

    if (failed) {
      const correctiveActions = [
        "Adjust eligibility criteria to improve NHCE participation.",
        "Modify employer contribution structure to balance benefits.",
        "Amend plan documents to meet IRS Safe Harbor requirements.",
      ];
      const consequences = [
        "Potential loss of tax benefits if noncompliant.",
        "IRS penalties and increased audit risk.",
        "Additional corrective contributions required.",
      ];
      csvRows.push([], ["Corrective Actions"], ...correctiveActions.map(a => ["", a]));
      csvRows.push([], ["Consequences"], ...consequences.map(c => ["", c]));
    }

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Safe_Harbor_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 6. Handle Enter Key ---
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // --- 7. Render ---
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload ADP Safe Harbor Coverage File
      </h2>

      {/* Plan Year Dropdown */}
      <div className="mb-6">
        <div className="flex items-center">
          {planYear === "" && (
            <span className="text-red-500 text-lg mr-2">*</span>
          )}
          <select
            id="planYear"
            value={planYear}
            onChange={(e) => setPlanYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">-- Select Plan Year --</option>
            {Array.from({ length: 41 }, (_, i) => 2010 + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p className="text-green-600 font-semibold">{file.name}</p>
        ) : isDragActive ? (
          <p className="text-blue-600">📂 Drop the file here...</p>
        ) : (
          <p className="text-gray-600">
            Drag & drop a <strong>CSV or Excel file</strong> here.
          </p>
        )}
      </div>

      {/* Download CSV Template Button */}
      <button
        onClick={downloadCSVTemplate}
        className="mt-4 w-full px-4 py-2 text-white bg-gray-500 hover:bg-gray-600 rounded-md"
      >
        Download CSV Template
      </button>

      {/* Choose File Button */}
      <button
        type="button"
        onClick={open}
        className="mt-4 w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
      >
        Choose File
      </button>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        className={`w-full mt-4 px-4 py-2 text-white rounded-md ${
          !file || !planYear ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
        }`}
        disabled={!file || !planYear || loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* Display Results */}
      {result && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-md">
          <h3 className="font-bold text-xl text-gray-700">
            ADP Safe Harbor Coverage Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result["Total Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligible Employees:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result["Eligible Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligibility Percentage:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result["Eligibility Percentage (%)"] !== undefined
                  ? result["Eligibility Percentage (%)"] + "%"
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Average Employer Contribution:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result["Average Employer Contribution (%)"] !== undefined
                  ? formatCurrency(result["Average Employer Contribution (%)"])
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">HCE Benefits (Avg):</strong>{" "}
              <span className="font-semibold text-black-600">
                {result["HCE Benefits (Avg)"] !== undefined
                  ? formatCurrency(result["HCE Benefits (Avg)"])
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">NHCE Benefits (Avg):</strong>{" "}
              <span className="font-semibold text-black-600">
                {result["NHCE Benefits (Avg)"] !== undefined
                  ? formatCurrency(result["NHCE Benefits (Avg)"])
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Benefit Ratio:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result["Benefit Ratio (%)"] !== undefined
                  ? formatPercentage(result["Benefit Ratio (%)"])
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Test Result:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-md font-bold ${
                  result["Test Result"] === "Passed"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {result["Test Result"] ?? "N/A"}
              </span>
            </p>
          </div>

          {/* Export & Download Buttons */}
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={exportToPDF}
              className="w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
            >
              Export PDF Report
            </button>
            <button
              onClick={downloadResultsAsCSV}
              className="w-full px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-md"
            >
              Download CSV Report
            </button>
          </div>

          {/* Corrective Actions & Consequences if Test Failed */}
          {result["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Review and verify employee classifications.</li>
                  <br />
                  <li>Recalculate benefit allocations for compliance.</li>
                  <br />
                  <li>Amend plan documents to clarify classification rules.</li>
                  <br />
                  <li>Consult with legal or tax advisors for corrections.</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ Loss of tax-exempt status for key employees.</li>
                  <br />
                  <li>❌ IRS compliance violations and penalties.</li>
                  <br />
                  <li>❌ Plan disqualification risks.</li>
                  <br />
                  <li>❌ Employee dissatisfaction and legal risks.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} // Closing brace for ADPSafeHarborTest

export default ADPSafeHarborTest;
