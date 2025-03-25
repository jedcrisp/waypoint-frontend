import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";

const CoverageTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year selection

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


  // ----- 1. Drag & Drop Logic -----
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

  // ----- 2. Upload File to Backend -----
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }
    // Validate file type
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
    formData.append("selected_tests", "coverage");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/coverage`);
      // 1. Get Firebase token
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      console.log("Firebase Token:", token);
      // 2. Send POST request
      const response = await axios.post(`${API_URL}/upload-csv/coverage`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["coverage"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ----- 3. Render Plan Year Dropdown -----
  const renderPlanYearDropdown = () => (
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
  );

  // ----- 4. Download CSV Template -----
  const downloadCSVTemplate = () => {
    const csvTemplate = [
  ["Last Name", "First Name", "Employee ID", "Eligible for Plan", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test", "Union Employee", "Part-Time / Seasonal", "Plan Entry Date"],
  ["Last", "First", "E001", "Yes", "No", "1985-04-12", "2015-01-01", "Active", "No", "No", "No", "2016-01-01"],
  ["Last", "First", "E002", "Yes", "Yes", "1990-06-15", "2018-03-10", "Active", "No", "No", "No", "2019-01-01"],
  ["Last", "First", "E003", "No", "No", "1992-09-22", "2020-07-20", "Active", "No", "No", "No", "2021-01-01"],
  ["Last", "First", "E004", "Yes", "Yes", "1988-12-05", "2012-11-30", "Active", "No", "No", "No", "2013-01-01"],
  ["Last", "First", "E005", "Yes", "No", "1983-02-18", "2010-05-25", "Active", "No", "No", "No", "2011-01-01"],
  ["Last", "First", "E006", "No", "No", "2000-07-10", "2023-03-01", "Active", "No", "No", "No", "2023-03-01"],
  ["Last", "First", "E007", "Yes", "No", "1995-11-03", "2016-09-15", "Active", "No", "No", "No", "2017-01-01"],
  ["Last", "First", "E008", "Yes", "Yes", "1987-01-28", "2011-06-14", "Active", "No", "No", "No", "2012-01-01"],
  ["Last", "First", "E009", "No", "No", "1999-05-09", "2022-08-20", "Active", "No", "Yes", "Yes", "2023-01-01"],
  ["Last", "First", "E010", "Yes", "No", "1991-10-17", "2017-04-22", "Terminated", "No", "No", "No", "2018-01-01"]
]

      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Coverage_Test_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 5. Download Results as CSV (with corrective actions if failed) -----
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const eligibleEmployees = result["Eligible Employees"] ?? "N/A";
    const eligibilityPercentage = result["Eligibility Percentage (%)"]
    const testResult = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Eligible Employees", eligibleEmployees],
      ["Eligibility Percentage (%)", formatPercentage(eligibilityPercentage)],
      ["Test Result", testResult],
    ];

    if (testRes.toLowerCase() === "failed") {
      const correctiveActions = [
        "Adjust eligibility requirements to ensure NHCEs meet the 70% threshold.",
        "Modify plan design to allow more NHCEs to participate.",
        "Ensure compliance with Ratio Percentage Test (70% of HCE rate).",
        "Review employee demographics to adjust contribution structures.",
      ];
      const consequences = [
        "Plan may lose tax-qualified status",
        "HCEs may have contributions refunded, reducing their tax benefits",
        "Additional corrective employer contributions may be required",
        "Increased IRS audit risk due to compliance failure",
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
    link.setAttribute("download", "Coverage_Test_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 6. Export to PDF (Using ACP-style layout for Coverage Test) -----
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const eligibleEmployees = result["Eligible Employees"] ?? "N/A";
    const eligibilityPercentage = result["Eligibility Percentage (%)"] ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Coverage Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${plan}`, 105, 25, { align: "center" });

    // Section 1: Basic Results Table
    pdf.autoTable({
      startY: 40,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", totalEmployees],
        ["Eligible Employees", eligibleEmployees],
        ["Eligibility Percentage (%)", formatPercentage(eligibilityPercentage)],
        ["Test Result", testResult],
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

    // Section 2: Summary Box
    const summaryStartY = pdf.lastAutoTable.finalY + 10;
    const boxWidth = 0;
    let boxHeight = 0;
    const failed = testResult.toLowerCase() === "failed";

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(10, summaryStartY, boxWidth, boxHeight, "S");

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    if (failed) {
      pdf.text("", 12, summaryStartY + 8);
    } else {
      pdf.text("", 12, summaryStartY + 8);
    }
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "",
      12,
      summaryStartY + 14,
      { maxWidth: 186 }
    );

    // Corrective actions & consequences (only if failed)
  if (failed) {
    const correctiveActions = [
        "Adjust eligibility requirements to ensure NHCEs meet the 70% threshold.",
        "Modify plan design to allow more NHCEs to participate.",
        "Ensure compliance with the Ratio Percentage Test.",
        "Review employee demographics to adjust contribution structures.",
    ];

    const consequences = [
        "Plan may lose tax-qualified status",
        "Potential IRS penalties and increased audit risk",
        "Additional corrective employer contributions may be required",
        "Reduced employee participation",
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
    pdf.text("Generated by Coverage Test Tool", 10, 290);

    console.log("Reached end of PDF function");

    pdf.save("Safe_Harbor_Coverage_Test_Results.pdf");
  };

  // ----- RENDER -----
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={(e) => handleKeyDown(e)}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload ADP Safe Harbor Coverage File
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
          <h3 className="font-bold text-xl text-gray-700">Safe Harbor Coverage Test Results</h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
            </p>
            <p className="text-lg">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              {result["Total Employees"] ?? "N/A"}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligible Employees:</strong>{" "}
              {result["Eligible Employees"] ?? "N/A"}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligibility Percentage:</strong>{" "}
              {result["Eligibility Percentage (%)"]
                ? result["Eligibility Percentage (%)"] + "%"
                : "N/A"}
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
                    Adjust eligibility requirements to ensure NHCEs meet the 70% threshold.
                  </li>
                  <br />
                  <li>
                    Modify plan design to allow more NHCEs to participate.
                  </li>
                  <br />
                  <li>
                    Ensure compliance with the Ratio Percentage Test.
                  </li>
                  <br />
                  <li>
                    Review employee demographics to adjust contribution structures.
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ Plan may lose tax-qualified status.</li>
                  <br />
                  <li>❌ HCEs may have contributions refunded, reducing their tax benefits.</li>
                  <br />
                  <li>❌ Additional corrective employer contributions may be required.</li>
                  <br />
                  <li>❌ Increased IRS audit risk due to compliance failure.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CoverageTest;
