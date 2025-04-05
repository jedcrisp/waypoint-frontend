import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth"; // Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";
import { savePdfResultToFirebase, saveAIReviewConsent } from "../utils/firebaseTestSaver";
import Modal from "../components/Modal";

const CoverageTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year selection
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [normalPdfExported, setNormalPdfExported] = useState(false);

  // States for AI Review
  const [aiReview, setAiReview] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [signature, setSignature] = useState("");

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // ---------- Formatting Helpers ----------
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "N/A";
    return `$${parseFloat(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "N/A";
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Auto-export PDF once results are available (if not already exported)
  useEffect(() => {
    if (result && !normalPdfExported) {
      exportToPDF();
      setNormalPdfExported(true);
    }
  }, [result, normalPdfExported]);

  // =========================
  // 1. Drag & Drop Logic
  // =========================
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
      setNormalPdfExported(false); // Reset export flag for new upload
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
    if (!planYear) {
      setError("❌ Please select a plan year.");
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
    formData.append("plan_year", planYear);

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/coverage`);
      // Get Firebase token
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      // Send POST request
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

  // =========================
  // 3. Render Plan Year Dropdown
  // =========================
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

  // =========================
  // 4. Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "Eligible for Plan",
        "HCE",
        "DOB",
        "DOH",
        "Employment Status",
        "Excluded from Test",
        "Union Employee",
        "Part-Time / Seasonal",
        "Plan Entry Date"
      ],
      ["Last", "First", "E001", "Yes", "No", "1985-04-12", "2015-01-01", "Active", "No", "No", "No", "2016-01-01"],
      ["Last", "First", "E002", "Yes", "Yes", "1990-06-15", "2018-03-10", "Active", "No", "No", "No", "2019-01-01"],
      ["Last", "First", "E003", "No", "No", "1992-09-22", "2020-07-20", "Active", "No", "No", "No", "2021-01-01"],
      ["Last", "First", "E004", "Yes", "Yes", "1988-12-05", "2012-11-30", "Active", "No", "No", "No", "2013-01-01"],
      ["Last", "First", "E005", "Yes", "No", "1983-02-18", "2010-05-25", "Active", "No", "No", "No", "2011-01-01"],
      ["Last", "First", "E006", "No", "No", "2000-07-10", "2023-03-01", "Active", "No", "No", "No", "2023-03-01"],
      ["Last", "First", "E007", "Yes", "No", "1995-11-03", "2016-09-15", "Active", "No", "No", "No", "2017-01-01"],
      ["Last", "First", "E008", "Yes", "Yes", "1987-01-28", "2011-06-14", "Active", "No", "No", "No", "2012-01-01"],
      ["Last", "First", "E009", "No", "No", "1999-05-09", "2022-08-20", "Active", "No", "Yes", "Yes", "2023-01-01"],
      ["Last", "First", "E010", "Yes", "No", "1991-10-17", "2017-04-22", "Terminated", "No", "No", "No", "2018-01-01"],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Coverage Template.csv");
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

    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const eligibilityPercentage =
      result["Eligibility Percentage (%)"] !== undefined
        ? result["Eligibility Percentage (%)"] + "%"
        : "N/A";
    const testRes = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Total Participants", totalParticipants],
      ["Eligibility Percentage (%)", eligibilityPercentage],
      ["Test Result", testRes],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Coverage Test Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 6. Export to PDF (with Firebase saving)
  // =========================
  const exportToPDF = async (customAiReview) => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const eligibilityPercentage =
      result["Eligibility Percentage (%)"] !== undefined
        ? formatPercentage(result["Eligibility Percentage (%)"])
        : "N/A";
    const testResult = result["Test Result"] ?? "N/A";
    const failed = testResult.toLowerCase() === "failed";
    const finalAIText = customAiReview !== undefined ? customAiReview : aiReview;

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Coverage Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${plan}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

    // Subheader with test criterion
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60);
    pdf.text(
      "Test Criterion: IRC §410(b): The Coverage Test ensures that a qualified retirement or benefit plan does not disproportionately favor highly compensated employees by requiring the plan to benefit a minimum percentage of non-highly compensated employees.",
      105,
      38,
      { align: "center", maxWidth: 180 }
    );

    // Results Table
    pdf.autoTable({
      startY: 54,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", totalEmployees],
        ["Total Participants", totalParticipants],
        ["Eligibility Percentage", eligibilityPercentage],
        ["Test Result", testResult],
      ],
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      styles: { fontSize: 12, font: "helvetica" },
      margin: { left: 10, right: 10 },
    });

    // Insert AI Review Section if available
    if (finalAIText) {
      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 10,
        theme: "grid",
        head: [["AI Corrective Actions (Powered by OpenAI)"]],
        body: [[finalAIText]],
        headStyles: { fillColor: [126, 34, 206], textColor: [255, 255, 255] },
        styles: { fontSize: 11, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });
    }

    // Digital Signature with Timestamp (if provided)
    if (signature.trim()) {
      const sigTime = new Date().toLocaleString();
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Digital Signature: ${signature.trim()}`, 10, 280);
      pdf.text(`Signed on: ${sigTime}`, 10, 285);
    }

    // Footer
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

    // Output PDF as a blob and save locally
    let pdfBlob;
    try {
      pdfBlob = pdf.output("blob");
      pdf.save("Coverage Test Results.pdf");
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }

    // Save PDF to Firebase using the helper function
    try {
      await savePdfResultToFirebase({
        fileName: "Coverage Test Results",
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
  // 7. AI Review Handler
  // =========================
  const handleRunAIReview = async () => {
    if (!result || !result.coverage_summary) {
      setError("❌ No test summary available for AI review.");
      return;
    }
    if (!consentChecked || !signature.trim()) {
      setShowConsentModal(true);
      return;
    }
    setLoading(true);
    try {
      await saveAIReviewConsent({
        fileName: "Coverage Test",
        signature: signature.trim(),
      });
      const response = await axios.post(`${API_URL}/api/ai-review`, {
        testType: "Coverage",
        testData: result.coverage_summary,
        signature: signature.trim(),
      });
      const aiText = response.data.analysis;
      setAiReview(aiText);
      // Automatically export PDF with AI review text (this will exclude corrective actions)
      await exportToPDF(aiText);
    } catch (error) {
      console.error("Error fetching AI review:", error);
      setAiReview("Error fetching AI review.");
    }
    setLoading(false);
  };

  // =========================
  // 8. Handle Enter Key
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
        📂 Upload Coverage File
      </h2>

      {/* Plan Year Dropdown */}
      {renderPlanYearDropdown()}

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
          <p className="text-green-600">📂 Drop the file here...</p>
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
        onClick={open}
        className="mt-2 w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
      >
        Choose File
      </button>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        className={`w-full mt-2 px-4 py-2 text-white rounded-md ${
          !file ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-400"
        }`}
        disabled={!file || loading}
      >
        {loading ? "Uploading..." : "Upload & Save PDF"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* Detailed Coverage Test Summary */}
      {result && (
        <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-md">
          <h4 className="font-bold text-lg text-gray-700 mb-2">
            Detailed Coverage Test Summary
          </h4>
          {/* Subheader with Plan Year & Test Result */}
          <div className="mb-4 flex justify-between items-center">
            <p>
              <strong>Plan Year:</strong>{" "}
              <span className="text-blue-600">{planYear || "N/A"}</span>
            </p>
            <p>
              <strong>Test Result:</strong>{" "}
              <span
                className={`px-2 py-1 rounded-md font-semibold ${
                  result?.["Test Result"] === "Passed"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {result?.["Test Result"] || "N/A"}
              </span>
            </p>
          </div>
          {/* Bullet Points with Data */}
          <ul className="list-disc list-inside text-gray-800">
            <li>
              <strong>Total Employees:</strong>{" "}
              {result?.["Total Employees"] ?? "N/A"}
            </li>
            <li>
              <strong>Total Participants:</strong>{" "}
              {result?.["Total Participants"] ?? "N/A"}
            </li>
            <li>
              <strong>Eligibility Percentage:</strong>{" "}
              {result?.["Eligibility Percentage (%)"] !== undefined
                ? `${parseFloat(result["Eligibility Percentage (%)"]).toFixed(2)}%`
                : "N/A"}
            </li>
          </ul>
        </div>
      )}

      {/* AI Review Section */}
      {result?.coverage_summary && (
        <div className="mt-6">
          <button
            onClick={handleRunAIReview}
            disabled={loading}
            className={`w-full px-4 py-2 text-white rounded-md ${
              loading ? "bg-purple-500 animate-pulse" : "bg-purple-500 hover:bg-purple-600"
            }`}
          >
            {loading ? "Processing AI Review..." : "Run AI Review"}
          </button>
        </div>
      )}

      {/* Display AI Review Results */}
      {aiReview && (
        <div className="mt-2 p-4 bg-indigo-50 border border-indigo-300 rounded-md">
          <h4 className="font-bold text-indigo-700">
            AI Corrective Actions (Powered by OpenAI):
          </h4>
          <p className="text-indigo-900">{aiReview}</p>
        </div>
      )}

      {/* Export & Download Buttons */}
          {result && (
  <div className="flex flex-col gap-2 mt-2">
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
)}


      {/* Corrective Actions & Consequences if Test Failed */}
      {result?.["Test Result"]?.toLowerCase() === "failed" && (
        <React.Fragment>
          <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
            <h4 className="font-bold text-gray-700">Corrective Actions:</h4>
            <ul className="list-disc list-inside text-gray-700">
              <li>Adjust eligibility requirements to ensure NHCEs meet the 70% threshold.</li>
              <br />
              <li>Modify plan design to allow more NHCEs to participate.</li>
              <br />
              <li>Ensure compliance with the Ratio Percentage Test.</li>
              <br />
              <li>Review employee demographics to adjust contribution structures.</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
            <h4 className="font-bold text-gray-700">Consequences:</h4>
            <ul className="list-disc list-inside text-gray-700">
              <li>Plan may lose tax-qualified status.</li>
              <br />
              <li>HCEs may have contributions refunded, reducing their tax benefits.</li>
              <br />
              <li>Additional corrective employer contributions may be required.</li>
              <br />
              <li>Increased IRS audit risk due to compliance failure.</li>
            </ul>
          </div>
        </React.Fragment>
      )}

      {/* Consent Modal for AI Review */}
      {showConsentModal && (
        <Modal title="AI Review Consent" onClose={() => setShowConsentModal(false)}>
          <p className="mb-4 text-sm text-gray-700">
            By proceeding, you acknowledge that any uploaded data may contain PII and you authorize its redaction and analysis using OpenAI’s language model. This is strictly for suggesting corrective actions.
          </p>
          <div className="mb-3 flex items-center">
            <input
              type="checkbox"
              id="consent"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="consent" className="text-sm text-gray-700">
              I agree to the processing and redaction of PII through OpenAI.
            </label>
          </div>
          <div className="mb-3">
            <label htmlFor="signature" className="text-sm text-gray-700">
              Enter your name as a digital signature:
            </label>
            <input
              id="signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Full Name"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              onClick={() => setShowConsentModal(false)}
            >
              Cancel
            </button>
            <button
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              disabled={!consentChecked || !signature.trim()}
              onClick={async () => {
                setShowConsentModal(false);
                try {
                  await saveAIReviewConsent({
                    fileName: "Coverage Test",
                    signature: signature.trim(),
                  });
                  await handleRunAIReview();
                } catch (err) {
                  console.error("Error saving consent or running AI review:", err);
                  setError("❌ Error processing AI review consent.");
                }
              }}
            >
              Confirm & Run AI Review
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CoverageTest;
