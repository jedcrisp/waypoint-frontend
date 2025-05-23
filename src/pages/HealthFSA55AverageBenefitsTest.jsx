import React, { useState, useCallback } from "react";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Ensure this utility exports the helper function
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";

const HealthFSA55AverageBenefitsTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan Year dropdown state

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // ---------- Formatting Helpers ----------
  const formatCurrency = (amount) => {
  const number = parseFloat(amount);
  return !isNaN(number) ? `$${number.toFixed(2)}` : "$0.00";
};


  const formatPercentage = (value) => {
  const number = parseFloat(value);
  return isNaN(number) ? "0.00%" : `${number.toFixed(2)}%`;
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
    // Validate file type (CSV or Excel)
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
    formData.append("selected_tests", "health_fsa_55_average_benefits");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/health_fsa_55_average_benefits`);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      console.log("Firebase Token:", token);

      const response = await axios.post(
        `${API_URL}/upload-csv/health_fsa_55_average_benefits`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["health_fsa_55_average_benefits"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger upload on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // =========================
  // 3. CSV Template Download
  // =========================
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "Health FSA Benefits",
        "HCE",
        "DOB",
        "DOH",
        "Employment Status",
        "Excluded from Test",
        "Plan Entry Date",
        "Union Employee",
        "Part-Time / Seasonal"
      ],
      ["Last", "First", "001", "1000.00", "Yes", "1980-05-10", "2010-06-01", "Active", "No", "2011-01-01", "No", "No"],
      ["Last", "First", "002", "1500.00", "No", "1985-08-15", "2012-03-10", "Active", "No", "2013-01-01", "No", "Yes"],
      ["Last", "First", "003", "2000.00", "Yes", "1975-01-20", "2005-05-05", "Active", "No", "2006-01-01", "Yes", "No"],
      ["Last", "First", "004", "1200.00", "No", "1990-12-01", "2020-08-20", "Active", "Yes", "2021-01-01", "No", "No"],
      ["Last", "First", "005", "1800.00", "Yes", "1995-07-19", "2021-04-10", "Leave", "No", "2022-01-01", "No", "Yes"],
      ["Last", "First", "006", "1100.00", "No", "1982-11-03", "2009-11-01", "Active", "No", "2010-01-01", "Yes", "No"],
      ["Last", "First", "007", "1300.00", "Yes", "2001-04-25", "2022-09-15", "Active", "No", "2023-01-01", "No", "No"],
      ["Last", "First", "008", "1600.00", "No", "1978-02-14", "2000-01-01", "Terminated", "No", "2001-01-01", "Yes", "Yes"],
      ["Last", "First", "009", "1400.00", "Yes", "1999-06-30", "2019-03-05", "Active", "No", "2020-01-01", "No", "No"],
      ["Last", "First", "010", "1700.00", "No", "2003-09-12", "2023-01-10", "Active", "No", "2023-07-01", "Yes", "Yes"]
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Health FSA 55% Average Benefits Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 4. CSV Results Download
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      ["Total Health FSA Benefits (Avg)", result["Total Health FSA Benefits (Avg)"] ?? "N/A"],
      ["NHCE Average Benefits", result["NHCE Average Benefits"] ?? "N/A"],
      ["HCE Average Benefits", result["HCE Average Benefits"] ?? "N/A"],
      ["Average Benefits Ratio (%)", result["Average Benefits Ratio (%)"] ?? "N/A"],
      ["Test Result", result["Test Result"] ?? "N/A"],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Health FSA 55% Average Benefits Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 5. Export to PDF with Firebase Save
  // =========================
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    let pdfBlob;
    try {
      const totalHealthFsaBenefits = formatCurrency(result["Total Health FSA Benefits (Avg)"]);
      const nhceAverageBenefits = formatCurrency(result["NHCE Average Benefits"]);
      const hceAverageBenefits = formatCurrency(result["HCE Average Benefits"]);
      const averageBenefitsRatio = formatPercentage(result["Average Benefits Ratio (%)"]);
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Health FSA 55% Average Benefits Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        "Test Criterion: (IRC §105(h)): The average benefits provided to non-highly compensated employees under the Health FSA must be at least 55% of the average benefits provided to highly compensated employees.",
        105,
        38,
        { align: "center", maxWidth: 180 }
      );

      // Table with Results
      pdf.autoTable({
        startY: 52,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
                ["Total Health FSA Benefits (Avg)", totalHealthFsaBenefits ?? "N/A"],
                ["NHCE Average Benefits", nhceAverageBenefits ?? "N/A"],
                ["HCE Average Benefits", hceAverageBenefits ?? "N/A"],
                ["Average Benefits Ratio", averageBenefitsRatio ?? "N/A"],
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

      if (result["Test Result"]?.toLowerCase() === "failed") {
        // Add Corrective Actions & Consequences
        const correctiveActions = [
          "• Review and adjust contributions to ensure NHCE average benefit is at least 55% of HCE average benefit",
          "• Increase NHCE participation or modify formulas accordingly",
          "• Reevaluate plan design to improve IRS compliance",
        ];

        const consequences = [
          "• Potential reclassification of benefits as taxable",
          "• Increased IRS scrutiny and potential penalties",
          "• Risk of plan disqualification",
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

      // Generate PDF blob and save locally
      pdfBlob = pdf.output("blob");
      pdf.save("Health FSA 55% Average Benefits Results.pdf");
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }
    try {
      await savePdfResultToFirebase({
        fileName: "Health FSA 55% Average Benefits",
        pdfBlob,
        additionalData: {
          planYear,
          testResult: result["Test Result"] ?? "Unknown",
        },
      });
    } catch (error) {
      setError(`❌ Error saving PDF to Firebase: ${error.message}`);
    }
  };

  // =========================
  // 6. RENDER
  // =========================
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload Health FSA 55% Average Benefits Test File
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
          isDragActive ? "border-green-500 bg-blue-100" : "border-gray-300 bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p className="text-green-600 font-semibold">{file.name}</p>
        ) : isDragActive ? (
          <p className="text-blue-600">📂 Drop the file here...</p>
        ) : (
          <p className="text-gray-600">
            Drag & drop a <strong>CSV file</strong> here.
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
        onClick={() => open()}
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
            Health FSA 55% Average Benefits Test Results
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
                {result?.["Total Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Total Participants:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Participants"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">HCE Average Benefit:</strong>{" "}
              <span className="font-semibold text-gray-800">
                {result?.["HCE Average Benefits"] !== undefined
                  ? formatCurrency(result["HCE Average Benefits"])
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">NHCE Average Benefit:</strong>{" "}
              <span className="font-semibold text-gray-800">
                {result?.["NHCE Average Benefits"] !== undefined
                  ? formatCurrency(result["NHCE Average Benefits"])
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Average Benefit Ratio:</strong>{" "}
              <span className="font-semibold text-gray-800">
                {result?.["Average Benefit Ratio (%)"] !== undefined
                  ? formatPercentage(result["Average Benefit Ratio (%)"])
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Test Result:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-md font-bold ${
                  result?.["Test Result"] === "Passed"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {result?.["Test Result"] ?? "N/A"}
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

          {/* If test fails, show corrective actions & consequences */}
          {result?.["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>
                    Review and adjust contributions to ensure that the NHCE average benefit is at least 55% of the HCE average benefit.
                  </li>
                  <br />
                  <li>
                    Increase NHCE participation or modify the contribution formulas accordingly.
                  </li>
                  <br />
                  <li>
                    Reevaluate plan design to improve compliance with IRS requirements.
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Potential reclassification of Health FSA benefits as taxable for HCEs.</li>
                  <br />
                  <li>Increased IRS scrutiny and potential penalties.</li>
                  <br />
                  <li>Additional employer contributions might be required to correct the imbalance.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthFSA55AverageBenefitsTest;
