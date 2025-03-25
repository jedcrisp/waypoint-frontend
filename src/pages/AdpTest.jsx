import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth"; // Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";

function AdpTest() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year dropdown

  // Make sure VITE_BACKEND_URL is defined in your .env file
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // ---------- Formatting Helpers ----------
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

  // --------- 1. Drag & Drop Logic ---------
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv, .xls, .xlsx", // Accept CSV, XLS, XLSX files
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // --------- 2. Upload File to Backend ---------
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }

    const validFileTypes = [".csv", ".xlsx"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!validFileTypes.includes(`.${fileExtension}`)) {
      setError("❌ Invalid file type. Please upload a CSV or Excel file.");
      return;
    }

    if (!planYear) {
      setError("❌ Please select a plan year.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("selected_tests", "adp");

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/upload-csv/adp`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Expected response structure:
      // { "Test Results": { "adp": { "HCE ADP (%)": 12.6, "NHCE ADP (%)": 2.14, "Test Result": "Passed" } } }
      const adpResults = response.data?.["Test Results"]?.["adp"];
      if (!adpResults) {
        setError("❌ No ADP test results found in response.");
      } else {
        console.log("Received ADP result:", adpResults);
        setResult(adpResults);
      }
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // --------- 3. Handle Enter Key ---------
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // --------- 4. Download CSV Template ---------
  const downloadCSVTemplate = () => {
    const csvTemplate = [
  ["Last Name", "First Name", "Employee ID", "Compensation", "Employee Deferral", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"],
  ["Last", "First", "001", "85000", "5000", "Yes", "1982-04-12", "2010-06-01", "Active", "No", "2011-01-01", "No", "No"],
  ["Last", "First", "002", "62000", "3500", "No", "1988-11-23", "2015-08-10", "Active", "No", "2016-01-01", "No", "No"],
  ["Last", "First", "003", "47000", "2500", "No", "1993-07-14", "2020-02-20", "Active", "No", "2020-03-01", "No", "Yes"],
  ["Last", "First", "004", "91000", "5500", "Yes", "1980-01-30", "2008-11-01", "Active", "No", "2009-01-01", "No", "No"],
  ["Last", "First", "005", "51000", "3000", "No", "1991-03-22", "2016-04-15", "Active", "No", "2016-05-01", "No", "No"],
  ["Last", "First", "006", "97000", "6000", "Yes", "1975-10-08", "2005-01-20", "Active", "No", "2005-02-01", "Yes", "No"],
  ["Last", "First", "007", "45000", "2000", "No", "1995-06-18", "2021-07-01", "Active", "No", "2021-08-01", "No", "Yes"],
  ["Last", "First", "008", "88000", "5200", "Yes", "1983-12-03", "2011-03-12", "Active", "No", "2011-04-01", "No", "No"],
  ["Last", "First", "009", "53000", "2800", "No", "1990-09-17", "2018-10-10", "Active", "No", "2018-11-01", "No", "No"],
  ["Last", "First", "010", "66000", "3700", "No", "1987-02-05", "2013-05-05", "Active", "No", "2013-06-01", "No", "No"]
]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ADP_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --------- 5. Download Results as CSV (with Corrective Actions & Consequences) ---------
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    const plan = planYear || "N/A";
    // Use the keys from your backend response
    const totalEmployees = result["Total Employees"] !== undefined ? result["Total Employees"] : "N/A";
    const hceAdp = result["HCE ADP (%)"] !== undefined ? result["HCE ADP (%)"] : "N/A";
    const nhceAdp = result["NHCE ADP (%)"] !== undefined ? result["NHCE ADP (%)"] : "N/A";
    const testRes = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", result["Total Employees"] !== undefined ? result["Total Employees"] : "N/A"],
      ["HCE ADP (%)", hceAdp],
      ["NHCE ADP (%)", nhceAdp],
      ["Test Result", testRes],
    ];

    if (testRes.toLowerCase() === "failed") {
      const correctiveActions = [
        "Refund Excess Contributions to HCEs by March 15 to avoid penalties.",
        "Make Additional Contributions to NHCEs via QNEC or QMAC.",
        "Recharacterize Excess HCE Contributions as Employee Contributions.",
      ];
      const consequences = [
        "Excess Contributions Must Be Refunded",
        "IRS Penalties and Compliance Risks",
        "Loss of Tax Benefits for HCEs",
        "Plan Disqualification Risk",
        "Employee Dissatisfaction & Legal Risks",
      ];

      csvRows.push(["", ""]);
      csvRows.push(["Corrective Actions", ""]);
      correctiveActions.forEach((action) => {
        csvRows.push(["", action]);
      });

      csvRows.push(["", ""]);
      csvRows.push(["Consequences", ""]);
      consequences.forEach((item) => {
        csvRows.push(["", item]);
      });
    }

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ADP_Test_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --------- 6. Export to PDF (Using the ACP-style Layout) ---------
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    // Log the result object for debugging
    console.log("Result Object:", result);

    // Extract data from the result object
    const totalEmployees = result["Total Employees"] !== undefined
    const hceAvg = result["HCE ADP (%)"] !== undefined
      ? `${result["HCE ADP (%)"]}%`
      : "N/A";
    const nhceAvg = result["NHCE ADP (%)"] !== undefined
      ? `${result["NHCE ADP (%)"]}%`
      : "N/A";
    const testResult = result["Test Result"] || "N/A";

    // Define the `failed` variable
    const failed = testResult.toLowerCase() === "failed";

    // Create jsPDF instance
    const pdf = new jsPDF("p", "mm", "a4");

    // =========================
    // 1. PDF Header
    // =========================
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("ADP Test Results", 105, 15, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`Plan Year: ${planYear || "N/A"}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

    // =========================
    // 2. Results Table
    // =========================
    pdf.autoTable({
      startY: 40,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", totalEmployees],
        ["HCE ADP)", hceAvg],
        ["NHCE ADP", nhceAvg],
        ["Test Result", testResult],
      ],
      headStyles: {
        fillColor: [41, 128, 185], // A blue header
        textColor: [255, 255, 255], // White text
      },
      styles: {
        fontSize: 12,
        font: "helvetica",
      },
      margin: { left: 10, right: 10 },
    });

    const nextY = pdf.lastAutoTable.finalY + 10;

    // =========================
    // 3. Corrective Actions (Only if Failed)
    // =========================

    // Corrective actions & consequences (only if failed)
  if (failed) {
    const correctiveActions = [
        "Refund Excess Contributions to HCEs by March 15 to avoid penalties.",
        "Make Additional Contributions to NHCEs via QNEC or QMAC.",
        "Recharacterize Excess HCE Contributions as Employee Contributions.",
      ];

    const consequences = [
        "Excess Contributions Must Be Refunded",
        "IRS Penalties and Compliance Risks",
        "Loss of Tax Benefits for HCEs",
        "Plan Disqualification Risk",
        "Employee Dissatisfaction & Legal Risks",
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

    // =========================
    // 4. Footer
    // =========================
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100); // Gray text
    pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

    // Save PDF
    pdf.save("ADP_Test_Results.pdf");
  };

  // --------- RENDER ---------
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload ADP File
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
            className="flex-3 px-4 py-2 border border-gray-300 rounded-md"
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
          isDragActive
            ? "border-green-500 bg-blue-100"
            : "border-gray-300 bg-gray-50"
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
          !file || !planYear
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-400"
        }`}
        disabled={!file || !planYear || loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* Display Results */}
      {result && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h3 className="font-bold text-xl text-gray-700 flex items-center">
            ACP Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {planYear || "N/A"}
              </span>
            </p>
            <p className="text-lg">
  <strong className="text-gray-700">Total Employees:</strong>{" "}
  <span className="font-semibold text-blue-600">
    {result?.["Total Employees"] ?? "N/A"}
  </span>
</p>

<p className="text-lg mt-2">
  <strong className="text-gray-700">HCE ACP:</strong>{" "}
  <span className="font-semibold text-black-600">
    {formatPercentage(result?.["HCE ADP (%)"])}
  </span>
</p>

<p className="text-lg mt-2">
  <strong className="text-gray-700">NHCE ACP:</strong>{" "}
  <span className="font-semibold text-black-600">
    {formatPercentage(result?.["NHCE ADP (%)"])}
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

            {/* Export & Download Buttons */}
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={exportToPDF}
                className="w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
              >
                Export PDF Results
              </button>
              <button
                onClick={downloadResultsAsCSV}
                className="w-full px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-md"
              >
                Download CSV Results
              </button>
            </div>

            {/* If test fails, show corrective actions & consequences in the UI */}
            {result["Test Result"]?.toLowerCase() === "failed" && (
              <>
                <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                  <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                  <ul className="list-disc list-inside text-black-600">
                    <li>
                      Refund Excess Contributions to HCEs by March 15 to avoid
                      penalties.
                    </li>
                    <br />
                    <li>
                      Make Additional Contributions to NHCEs via QNEC or QMAC.
                    </li>
                    <br />
                    <li>
                      Recharacterize Excess HCE Contributions as Employee
                      Contributions.
                    </li>
                  </ul>
                </div>

                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                  <h4 className="font-bold text-black-600">Consequences:</h4>
                  <ul className="list-disc list-inside text-black-600">
                    <li>❌ Excess Contributions Must Be Refunded</li>
                    <br />
                    <li>❌ IRS Penalties and Compliance Risks</li>
                    <br />
                    <li>❌ Loss of Tax Benefits for HCEs</li>
                    <br />
                    <li>❌ Plan Disqualification Risk</li>
                    <br />
                    <li>❌ Employee Dissatisfaction & Legal Risks</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdpTest;
