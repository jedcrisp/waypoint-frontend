import React, { useState, useCallback } from "react";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Firebase PDF saver
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const RatioPercentageTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year selection
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // =========================
  // Helpers for Formatting
  // =========================
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return "N/A";
    }
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return "N/A";
    }
    return `${Number(value).toFixed(2)}%`;
  };

  // =========================
  // Drag & Drop Logic
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
  // Upload File to Backend
  // =========================
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
    formData.append("selected_tests", "ratio_percentage");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/ratio_percentage`);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      console.log("Firebase Token:", token);
      const response = await axios.post(`${API_URL}/upload-csv/ratio_percentage`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["ratio_percentage"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.error || "❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Handle Enter Key
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // =========================
  // Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    const csvData = [
      ["Last Name", "First Name", "Employee ID", "Eligible for Plan", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"],
      ["Last", "First", "001", "Yes", "No", "1980-01-01", "2010-06-15", "Active", "No", "2020-01-01", "No", "No"],
      ["Last", "First", "002", "Yes", "Yes", "1975-05-20", "2008-03-10", "Active", "No", "2018-01-01", "No", "No"],
      ["Last", "First", "003", "No", "No", "1990-12-12", "2022-01-01", "Active", "No", "2022-01-01", "No", "No"],
      ["Last", "First", "004", "Yes", "No", "1985-07-07", "2015-09-09", "Active", "No", "2015-09-09", "No", "No"],
      ["Last", "First", "005", "No", "Yes", "1978-03-03", "2007-05-05", "Terminated", "Yes", "2018-05-05", "No", "No"],
      ["Last", "First", "006", "Yes", "Yes", "1988-10-10", "2018-11-11", "Active", "No", "2018-11-11", "No", "No"],
      ["Last", "First", "007", "Yes", "No", "1995-04-04", "2020-07-07", "Active", "No", "2020-07-07", "No", "No"],
      ["Last", "First", "008", "No", "No", "1992-08-08", "2019-12-12", "Active", "No", "2019-12-12", "No", "No"],
      ["Last", "First", "009", "Yes", "Yes", "1982-09-09", "2012-02-02", "Active", "No", "2012-02-02", "No", "No"],
      ["Last", "First", "010", "No", "No", "2000-11-11", "2023-03-03", "Active", "No", "2023-03-03", "No", "No"],
    ];
    const csvTemplate = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Ratio Percentage Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // Download Results as CSV
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const totalHCEs = result["Total HCEs"] ?? "N/A";
    const totalNHCEs = result["Total NHCEs"] ?? "N/A";
    const hceEligibility = result["HCE Eligibility (%)"] ?? "N/A";
    const nhceEligibility = result["NHCE Eligibility (%)"] ?? "N/A";
    const testRes = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Total Participants", totalParticipants],
      ["HCE Eligibility (%)", hceEligibility],
      ["NHCE Eligibility (%)", nhceEligibility],
      ["Total HCEs", totalHCEs],
      ["Total NHCEs", totalNHCEs],
      ["Test Result", testRes],
    ];


    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Ratio Percentage Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // Export to PDF with Firebase Storage Integration
  // =========================
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    let pdfBlob;
    try {
      const totalEmployees = result["Total Employees"] ?? "N/A";
      const totalParticipants = result["Total Participants"] ?? "N/A";
      const hceEligibility = result["HCE Eligibility (%)"] !== undefined
        ? formatPercentage(result["HCE Eligibility (%)"])
        : "N/A";
      const nhceEligibility = result["NHCE Eligibility (%)"] !== undefined
        ? formatPercentage(result["NHCE Eligibility (%)"])
        : "N/A";
      const totalHCEs = result["Total HCEs"] ?? "N/A";
      const totalNHCEs = result["Total NHCEs"] ?? "N/A";
      const testRes = result["Test Result"] ?? "N/A";
      const failed = testRes.toLowerCase() === "failed";

      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ratio Percentage Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear || "N/A"}`, 105, 25, { align: "center" });
      const generatedTimestamp = new Date().toLocaleString();
      pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

      // Subheader with test criterion
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        "Test Criterion: IRC §410(b): The Ratio Percentage Test compares the percentage of Non-Highly Compensated Employees (NHCEs) benefiting under the plan to the percentage of Highly Compensated Employees (HCEs), requiring the ratio to be at least 70% for the plan to pass.",
        105,
        38,
        { align: "center", maxWidth: 180 }
      );

      // Basic Results Table
      pdf.autoTable({
        startY: 54,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", totalEmployees],
          ["Total Participants", totalParticipants],
          ["HCE Eligibility (%)", hceEligibility],
          ["NHCE Eligibility (%)", nhceEligibility],
          ["Total HCEs", totalHCEs],
          ["Total NHCEs", totalNHCEs],
          ["Test Result", testRes],
        ],
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 12, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });

      // If test failed, add corrective actions & consequences
      if (failed) {
        const correctiveActions = [
          "Increase NHCE participation to ensure at least 70% of HCE rate.",
          "Adjust eligibility criteria to include more NHCEs.",
          "Modify plan design to encourage NHCE participation.",
          "Review and adjust contribution allocations per IRS § 410(b).",
        ];
        const consequences = [
          "Mandatory employer contributions for non-key employees.",
          "Potential loss of plan tax advantages.",
          "Increased IRS audit risk.",
          "Additional corrective contributions may be required.",
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
          body: consequences.map((item) => [item]),
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

      try {
        pdfBlob = pdf.output("blob");
        pdf.save("Ratio Percentage Test Results.pdf");
      } catch (error) {
        setError(`❌ Error exporting PDF: ${error.message}`);
        return;
      }
      try {
        await savePdfResultToFirebase({
          fileName: "Ratio Percentage",
          pdfBlob,
          additionalData: {
            planYear,
            testResult: testRes || "Unknown",
          },
        });
      } catch (error) {
        setError(`❌ Error saving PDF to Firebase: ${error.message}`);
      }
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
    }
  };

  // =========================
  // Render
  // =========================
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload Ratio Percentage File
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
        <input
          type="file"
          accept=".csv, .xlsx"
          onChange={(e) => setFile(e.target.files[0])}
          className="hidden"
        />
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

      {/* Choose File Button */}
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
          !file || !planYear ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-400"
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
          <h3 className="font-bold text-xl text-gray-700">Ratio Percentage Test Results</h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong>Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
            </p>
            <p className="text-lg mt-2">
              <strong>Total Employees:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong>Total Participants:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Participants"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong>HCE Eligibility:</strong>{" "}
              {formatPercentage(result["HCE Eligibility (%)"])}
            </p>
            <p className="text-lg mt-2">
              <strong>NHCE Eligibility:</strong>{" "}
              {formatPercentage(result["NHCE Eligibility (%)"])}
            </p>
            <p className="text-lg mt-2">
              <strong>Total HCEs:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total HCEs"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong>Total NHCEs:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total NHCEs"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong>Test Result:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-md font-bold ${
                  result["Test Result"] === "Passed" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}
              >
                {result["Test Result"] || "N/A"}
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

          {/* Render Corrective Actions & Consequences if Test Failed */}
          {result["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black">
                  <li>
                    Increase NHCE participation to ensure at least 70% of the HCE rate.
                  </li>
                  <br />
                  <li>
                    Adjust eligibility criteria to include more NHCEs.
                  </li>
                  <br />
                  <li>
                    Modify plan structure or incentives to encourage NHCE participation.
                  </li>
                  <br />
                  <li>
                    Review plan design to ensure compliance with IRC § 410(b).
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black">Consequences:</h4>
                <ul className="list-disc list-inside text-black">
                  <li>Plan may lose tax-qualified status.</li>
                  <br />
                  <li>IRS penalties and plan disqualification risk.</li>
                  <br />
                  <li>Additional corrective contributions may be required.</li>
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

export default RatioPercentageTest;
