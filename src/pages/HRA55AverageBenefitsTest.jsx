import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver";

const HRA55AverageBenefitsTest = () => {
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

  // ---------- Drag & Drop Logic ----------
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

  // ---------- Upload File to Backend ----------
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
    // Make sure this value matches what your backend expects
    formData.append("selected_tests", "hra_55_average_benefits");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/hra_55_average_benefits`);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      console.log("Firebase Token:", token);

      const response = await axios.post(`${API_URL}/upload-csv/hra_55_average_benefits`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["hra_55_average_benefits"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Download CSV Template ----------
  const downloadCSVTemplate = () => {
    const csvData = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "HRA Benefits",
        "HCE",
        "DOB",
        "DOH",
        "Employment Status",
        "Excluded from Test",
        "Plan Entry Date",
        "Union Employee",
        "Part-Time / Seasonal",
      ],
      ["Last", "First", "001", "2500", "No", "1980-05-10", "2010-06-01", "Active", "No", "2020-01-01", "No", "No"],
      ["Last", "First", "002", "3000", "Yes", "1975-08-15", "2008-03-10", "Active", "No", "2019-01-01", "No", "No"],
      ["Last", "First", "003", "0", "No", "1990-01-01", "2021-05-01", "Active", "No", "2022-01-01", "No", "No"],
      ["Last", "First", "004", "4000", "Yes", "1985-10-30", "2005-07-12", "Active", "No", "2020-01-01", "No", "No"],
      ["Last", "First", "005", "0", "No", "2000-12-01", "2022-08-20", "Terminated", "No", "2022-01-01", "No", "No"],
      ["Last", "First", "006", "3200", "Yes", "1992-05-14", "2018-11-11", "Active", "Yes", "2020-01-01", "No", "No"],
      ["Last", "First", "007", "2800", "No", "2002-01-05", "2023-09-10", "Active", "No", "2022-01-01", "No", "No"],
      ["Last", "First", "008", "0", "No", "1980-03-25", "2015-11-01", "Active", "No", "2020-01-01", "No", "No"],
      ["Last", "First", "009", "3500", "Yes", "1982-06-22", "2011-07-07", "Active", "No", "2020-01-01", "No", "No"],
      ["Last", "First", "010", "0", "No", "2003-09-12", "2023-01-10", "Active", "No", "2022-01-01", "No", "No"],
    ];

    const csvTemplate = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "HRA 55% Average Benefits Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------- Download Results as CSV ----------
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const hceAvg = result["HCE Average Benefit (%)"] ?? "N/A";
    const nhceAvg = result["NHCE Average Benefit (%)"] ?? "N/A";
    const avgBenefitRatio = result["Average Benefits Ratio (%)"] ?? "N/A";
    const testRes = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["HCE Average Benefit (%)", hceAvg],
      ["NHCE Average Benefit (%)", nhceAvg],
      ["Average Benefit Ratio (%)", avgBenefitRatio],
      ["Test Result", testRes],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "HRA 55% Average Benefits Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------- Export Results to PDF with Save to Firebase ----------
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    const plan = planYear || "N/A";
    const hceAverageBenefits = formatCurrency(result["HCE Average Benefits"]);
    const nhceAverageBenefits = formatCurrency(result["NHCE Average Benefits"]);
    const avgBenefitRatio = formatPercentage(result["Average Benefit Ratio (%)"]);
    const testCriterion = result["Test Criterion"] || "N/A";
    const testResult = result["Test Result"] || "N/A";
    const failed = testResult.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("HRA 55% Average Benefits Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${plan}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

    // Subheader with test criterion
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60);
    pdf.text(
      "Test Criterion: IRC §105(h)(2): The average benefits provided to non-highly compensated employees under an HRA must be at least 55% of the average benefits provided to highly compensated employees.",
      105,
      38,
      { align: "center", maxWidth: 180 }
    );

    // Summary Table
    pdf.autoTable({
      startY: 52,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", result["Total Employees"] || "N/A"],
        ["Total Participants", result["Total Participants"] || "N/A"],
        ["HCE Average Benefits", hceAverageBenefits],
        ["NHCE Average Benefits", nhceAverageBenefits],
        ["Average Benefit Ratio", avgBenefitRatio],
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

    // Corrective actions & consequences (only if failed)
    if (failed) {
      const correctiveActions = [
        "Increase NHCE benefits to meet or exceed 55% of the HCE average benefits.",
        "Review eligibility criteria to expand NHCE participation.",
        "Adjust benefit allocations to maintain compliance.",
        "Consult IRS § 410(b) for specific compliance requirements.",
      ];

      const consequences = [
        "Risk of plan failing nondiscrimination testing.",
        "Possible mandatory corrections and employer contributions.",
        "Potential IRS scrutiny or audits.",
        "Loss of tax-qualified status if unresolved.",
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

    // Footer
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

    // Generate PDF blob and save locally
    const pdfBlob = pdf.output("blob");
    pdf.save("HRA 55% Average Benefits Test Results.pdf");

    // Save PDF blob to Firebase
    try {
      await savePdfResultToFirebase({
        fileName: "HRA 55% Average Benefits",
        pdfBlob,
        additionalData: {
          planYear,
          testResult: result["Test Result"] || "Unknown",
        },
      });
    } catch (error) {
      setError(`❌ Error saving PDF to Firebase: ${error.message}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload HRA 55% Average Benefits File
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
          <h3 className="font-bold text-xl text-gray-700">
            HRA 55% Average Benefits Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong>Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {planYear || "N/A"}
              </span>
            </p>
            <p className="text-lg">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg">
              <strong className="text-gray-700">Total Participants:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Participants"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong>HCE Average Benefits:</strong>{" "}
              {formatCurrency(result?.["HCE Average Benefits"]) || "N/A"}
            </p>
            <p className="text-lg mt-2">
              <strong>NHCE Average Benefits:</strong>{" "}
              {formatCurrency(result?.["NHCE Average Benefits"]) || "N/A"}
            </p>
            <p className="text-lg mt-2">
              <strong>Average Benefit Ratio:</strong>{" "}
              {formatPercentage(result?.["Average Benefit Ratio (%)"]) || "N/A"}
            </p>
            <p className="text-lg mt-2">
              <strong>Test Result:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-md font-bold ${
                  result?.["Test Result"] === "Passed"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {result?.["Test Result"] || "N/A"}
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

          {/* Display Corrective Actions & Consequences if Test Failed */}
          {result?.["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black">
                  <li>
                    Review and adjust HRA contributions to meet the 55% requirement.
                  </li>
                  <br />
                  <li>
                    Increase NHCE participation or modify contribution formulas accordingly.
                  </li>
                  <br />
                  <li>
                    Reevaluate plan design to ensure compliance with IRS standards.
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black">Consequences:</h4>
                <ul className="list-disc list-inside text-black">
                  <li>HRA benefits for HCEs may become taxable.</li>
                  <br />
                  <li>Increased IRS audit risk.</li>
                  <br />
                  <li>Additional corrective contributions may be required.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HRA55AverageBenefitsTest;
