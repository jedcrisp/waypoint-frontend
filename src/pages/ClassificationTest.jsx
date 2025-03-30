import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver";

const ClassificationTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan Year dropdown state
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

  // =========================
  // 2. Upload File to Backend
  // =========================
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }
    // Validate file extension
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
    formData.append("selected_tests", "classification");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/classification`);
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

      // Send POST request with Bearer token
      const response = await axios.post(`${API_URL}/upload-csv/classification`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ API Response:", response.data);
      const classificationResults = response.data?.["Test Results"]?.["classification"];
      if (!classificationResults) {
        setError("❌ No classification test results found in response.");
      } else {
        setResult(classificationResults);
      }
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 3. Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      ["Last Name", "First Name", "Employee ID", "Eligible for Cafeteria Plan", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"],
      ["Last", "First", "E001", "Yes", "1985-04-12", "2015-01-01", "Active", "No", "2016-01-01", "No", "No"],
      ["Last", "First", "E002", "Yes", "1990-06-15", "2018-03-10", "Active", "No", "2019-01-01", "No", "No"],
      ["Last", "First", "E003", "No", "1992-09-22", "2020-07-20", "Active", "No", "2021-01-01", "No", "No"],
      ["Last", "First", "E004", "Yes", "1988-12-05", "2012-11-30", "Active", "No", "2013-01-01", "No", "No"],
      ["Last", "First", "E005", "Yes", "1983-02-18", "2010-05-25", "Active", "No", "2011-01-01", "No", "No"],
      ["Last", "First", "E006", "No", "2000-07-10", "2023-03-01", "Active", "No", "2023-03-01", "No", "No"],
      ["Last", "First", "E007", "Yes", "1995-11-03", "2016-09-15", "Active", "No", "2017-01-01", "No", "No"],
      ["Last", "First", "E008", "Yes", "1987-01-28", "2011-06-14", "Active", "No", "2012-01-01", "No", "No"],
      ["Last", "First", "E009", "No", "1999-05-09", "2022-08-20", "Active", "No", "2023-01-01", "No", "Yes"],
      ["Last", "First", "E010", "Yes", "1991-10-17", "2017-04-22", "Terminated", "No", "2018-01-01", "Yes", "No"],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Classification_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 4. Export Results to PDF (with Firebase saving)
  // =========================
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const eligibleForCafeteriaPlan = result["Eligible for Cafeteria Plan"] ?? "N/A";
    const eligibilityPercentage =
      result["Eligibility Percentage (%)"] !== undefined
        ? result["Eligibility Percentage (%)"] + "%"
        : "N/A";
    const testResult = result["Test Result"] ?? "N/A";
    const failed = testResult.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Classification Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${planYear || "N/A"}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

    // Subheader with test criterion
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60);
    pdf.text(
      "Test Criterion: At least 70% of eligible employees must be eligible for the cafeteria plan",
      105,
      38,
      { align: "center", maxWidth: 180 }
    );

    // Results Table
    pdf.autoTable({
      startY: 43,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", totalEmployees],
        ["Total Participants", totalParticipants],
        ["Eligible for Cafeteria Plan", eligibleForCafeteriaPlan],
        ["Eligibility Percentage (%)", eligibilityPercentage],
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

    // Add corrective actions & consequences if test failed
    if (failed) {
      const correctiveActions = [
        "Review and verify employee classifications",
        "Recalculate benefit allocations for compliance",
        "Amend plan documents to clarify classification rules",
        "Consult with legal/tax advisors for corrections",
      ];

      const consequences = [
        "Potential loss of tax-exempt status for key employees",
        "IRS penalties and plan disqualification risk",
        "Employee dissatisfaction and legal risks",
      ];

      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 10,
        theme: "grid",
        head: [["Corrective Actions"]],
        body: correctiveActions.map((action) => [action]),
        headStyles: { fillColor: [255, 0, 0], textColor: [255, 255, 255] },
        styles: { fontSize: 11, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });

      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 10,
        theme: "grid",
        head: [["Consequences"]],
        body: consequences.map((consequence) => [consequence]),
        headStyles: { fillColor: [238, 220, 92], textColor: [255, 255, 255] },
        styles: { fontSize: 11, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });
    }

    // Output PDF as a blob and save locally
    let pdfBlob;
    try {
      pdfBlob = pdf.output("blob");
      pdf.save("Classification_Test_Results.pdf");
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }

    // Save PDF to Firebase using the helper function
    try {
      await savePdfResultToFirebase({
        fileName: "Classification Test",
        pdfBlob,
        additionalData: {
          planYear,
          testResult: testResult || "Unknown",
        },
      });
    } catch (error) {
      setError(`❌ Error saving PDF to Firebase: ${error.message}`);
    }
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
      ["Total Employees", result["Total Employees"] ?? "N/A"],
      ["Total Participants", result["Total Participants"] ?? "N/A"],
      [
        "Eligible for Cafeteria Plan",
        result["Eligible for Cafeteria Plan"] ?? "N/A",
      ],
      [
        "Eligibility Percentage (%)",
        result["Eligibility Percentage (%)"] !== undefined
          ? result["Eligibility Percentage (%)"] + "%"
          : "N/A",
      ],
      ["Test Result", result["Test Result"] ?? "N/A"],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Classification_Test_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 6. Handle Enter Key
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload Classification Test File
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
          isDragActive
            ? "border-green-500 bg-blue-100"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p className="text-green-600 font-semibold">{file.name}</p>
        ) : isDragActive ? (
          <p className="text-green-600">📂 Drop the file here...</p>
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
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-md">
          <h3 className="font-bold text-xl text-gray-700">
            Classification Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong>Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
            </p>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result["Total Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Total Participants:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result["Total Participants"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligible for Cafeteria Plan:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result["Eligible for Cafeteria Plan"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">
                Eligibility Percentage (%):
              </strong>{" "}
              <span className="font-semibold text-black-600">
                {result["Eligibility Percentage (%)"] !== undefined
                  ? result["Eligibility Percentage (%)"] + "%"
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
                  <li>Recalculate benefit allocations to ensure compliance.</li>
                  <br />
                  <li>Amend plan documents to clarify classification rules.</li>
                  <br />
                  <li>Consult with legal or tax advisors for corrections.</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Loss of tax-exempt status for key employees.</li>
                  <br />
                  <li>IRS compliance violations and penalties.</li>
                  <br />
                  <li>Plan disqualification risks.</li>
                  <br />
                  <li>Employee dissatisfaction and legal risks.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassificationTest;
