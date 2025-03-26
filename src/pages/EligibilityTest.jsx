import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const EligibilityTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

  // =========================
  // 1. Drag & Drop Logic
  // =========================
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
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

  // =========================
  // 2. Upload File to Backend
  // =========================
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }
    const validFileTypes = ["csv", "xlsx"];
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!validFileTypes.includes(fileType)) {
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
    formData.append("selected_tests", "eligibility");

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/upload-csv/eligibility`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const eligibilityResults = response.data?.["Test Results"]?.["eligibility"];
      if (!eligibilityResults) {
        setError("❌ No Eligibility test results found in response.");
      } else {
        setResult(eligibilityResults);
      }
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 3. Handle Enter Key
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // =========================
  // 4. Download CSV Template
  // =========================
  // If you have a custom CSV template, you can define it here or rely on <CsvTemplateDownloader />
  const downloadCSVTemplate = () => {
    // Example CSV content
    const csvTemplate = [
  ["Last Name", "First Name", "Employee ID", "HCE", "DOB", "DOH", "Eligible for Plan", "Employment Status", "Excluded from Test", "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"],
  ["Last", "First", "001", "No", "1980-01-10", "2010-05-01", "Yes", "Active", "No", "2011-01-01", "No", "No"],
  ["Last", "First", "002", "Yes", "1975-03-15", "2005-07-12", "Yes", "Active", "No", "2006-01-01", "No", "No"],
  ["Last", "First", "003", "No", "1992-06-20", "2020-08-10", "Yes", "Active", "No", "2021-01-01", "No", "No"],
  ["Last", "First", "004", "Yes", "1983-11-30", "2008-02-25", "Yes", "Active", "No", "2009-01-01", "No", "No"],
  ["Last", "First", "005", "No", "2000-12-18", "2022-04-15", "No", "Terminated", "No", "2023-01-01", "No", "No"],
  ["Last", "First", "006", "Yes", "1988-09-05", "2015-06-01", "Yes", "Active", "No", "2016-01-01", "No", "No"],
  ["Last", "First", "007", "No", "2001-04-22", "2023-05-01", "Yes", "Active", "No", "2023-07-01", "No", "Yes"],
  ["Last", "First", "008", "Yes", "1979-07-10", "2006-09-20", "Yes", "Active", "No", "2007-01-01", "No", "No"],
  ["Last", "First", "009", "No", "1995-10-01", "2018-03-15", "Yes", "Leave", "No", "2019-01-01", "No", "No"],
  ["Last", "First", "010", "No", "2002-08-12", "2022-11-10", "No", "Active", "No", "2023-01-01", "No", "No"],
]

      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Cafeteria_Eligibility_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 5. Download Results as CSV
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      [
        "Key Employee Benefit Percentage",
        result["Key Employee Percentage"] !== undefined
          ? result["Key Employee Percentage"] + "%"
          : "N/A",
      ],
      ["Test Result", result["Test Result"] ?? "N/A"],
    ];

    if (result["Test Result"]?.toLowerCase() === "failed") {
      const correctiveActions = [
        "Reallocate benefits to balance distributions.",
        "Adjust classifications of key employees.",
        "Update contribution policies.",
      ];
      const consequences = [
        "Loss of tax-exempt status for key employees.",
        "IRS penalties and fines.",
        "Risk of plan disqualification.",
      ];
      csvRows.push(["", ""]);
      csvRows.push(["Corrective Actions", ""]);
      correctiveActions.forEach((action) => csvRows.push(["", action]));
      csvRows.push(["", ""]);
      csvRows.push(["Consequences", ""]);
      consequences.forEach((item) => csvRows.push(["", item]));
    }

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Cafeteria_Eligibility_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 6. Export to PDF
  // =========================
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

     const failed = result["Test Result"]?.toLowerCase() === "failed";
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Cafeteria Eligibility Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
    const generatedTimestamp = new Date().toLocaleString();
    pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

    // Table
     pdf.autoTable({
    startY: 40,
    theme: "grid",
    head: [["Metric", "Value"]],
    body: [
      ["Total Employees", result["Total Eligible Employees"] ?? "N/A"],
      ["HCE Count", result["HCE Count"] ?? "N/A"],
      ["HCE Percentage", result["HCE Percentage (%)"] !== undefined ? result["HCE Percentage (%)"] + "%": "N/A"],
      ["Test Result", result["Test Result"] ?? "N/A"],
    ],
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 12,
        font: "helvetica",
      },
      margin: { left: 10, right: 10 },
    });

    // Corrective actions & consequences (only if failed)
  if (failed) {
    const correctiveActions = [
        "Reallocate benefits to balance distributions",
        "Adjust classifications of key employees",
        "Update contribution policies",
    ];

    const consequences = [
        "Loss of tax-exempt status for key employees",
        "IRS penalties and fines",
        "Risk of plan disqualification",
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
    // Footer
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

    pdf.save("Cafeteria_Eligibility_Results.pdf");
  };

  // =========================
  // 7. RENDER
  // =========================
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload Cafeteria Eligibility File
      </h2>

      {/* Plan Year Dropdown */}
      <div className="mb-6">
        <div className="flex items-center">
          {planYear === "" && <span className="text-red-500 text-lg mr-2">*</span>}
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

      {/* "Choose File" Button */}
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
          !file ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-400"
        }`}
        disabled={!file || loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* Display Results */}
      {result && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h3 className="font-bold text-xl text-gray-700">
            ✅ Cafeteria Eligibility Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {planYear || "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
               <strong className="text-gray-700">Total Employees:</strong>{" "}
                <span className="font-semibold text-black-600">
                {result?.["Total Eligible Employees"] ?? "N/A"}
              </span>
              </p>
            <p className="text-lg mt-2">
               <strong className="text-gray-700">HCE Count:</strong>{" "}
                <span className="font-semibold text-black-600">
                {result?.["HCE Count"] ?? "N/A"}
              </span>
              </p>
           <p className="text-lg">
            <strong className="text-gray-700">HCE Percentage:</strong>{" "}
               <span className="font-semibold text-black-600">
                {formatPercentage(result?.["HCE Percentage (%)"])}
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

          {/* If test fails, show corrective actions & consequences in the UI */}
          {result["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Reallocate benefits to balance distributions.</li>
                  <br />
                  <li>Adjust classifications of key employees.</li>
                  <br />
                  <li>Update contribution policies.</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ Loss of tax-exempt status for key employees.</li>
                  <br />
                  <li>❌ IRS penalties and fines.</li>
                  <br />
                  <li>❌ Risk of plan disqualification.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EligibilityTest;
