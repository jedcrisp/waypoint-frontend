import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { savePdfResultToFirebase, saveAIReviewConsent } from "../utils/firebaseTestSaver";
import Modal from "../components/Modal";

const ACPTest = () => {
  // ----- State -----
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [aiReview, setAiReview] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [signature, setSignature] = useState("");
  const [normalPdfExported, setNormalPdfExported] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // ---------- Formatting Helpers ----------
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "$0.00";
    return `$${parseFloat(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "0.00%";
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Automatically export PDF once results are available (if not already exported)
  useEffect(() => {
    if (result && !normalPdfExported) {
      exportToPDF();
      setNormalPdfExported(true);
    }
  }, [result, normalPdfExported]);

  // ----- 1. Drag & Drop Logic -----
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
      setNormalPdfExported(false);
      setAiReview("");
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
    formData.append("selected_tests", "acp");
    formData.append("plan_year", planYear);

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv`);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      const response = await axios.post(`${API_URL}/upload-csv`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ API Response:", response.data);
      const acpResults = response.data?.acp;
      if (!acpResults) {
        setError("❌ No ACP test results found in response.");
      } else {
        setResult(acpResults);
      }
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "❌ Failed to upload file. Please check the format and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ----- 3. Download CSV Template -----
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      [
        "Last Name", "First Name", "Employee ID", "Compensation", "Employer Match",
        "DOB", "DOH", "Employment Status", "Excluded from Test",
        "Plan Entry Date", "Union Employee", "Part-Time / Seasonal", "Family Relationship", "Family Member"
      ],
      ["Doe", "John", "E001", 200000, 5000, "1980-04-12", "2010-01-01", "Active", "No", "2010-01-01", "No", "No", "spouse", "Jane Doe"],
      ["Doe", "Jane", "E002", 180000, 4500, "1985-03-22", "2012-05-30", "Active", "No", "2012-01-01", "No", "No", "", ""],
      ["Smith", "Alice", "E003", 300000, 7500, "1975-07-12", "2005-08-01", "Active", "No", "2005-08-01", "No", "No", "child", "Bob Smith"],
      ["Smith", "Bob", "E004", 50000, 1250, "1992-10-19", "2021-04-05", "Active", "No", "2021-04-05", "No", "No", "", ""],
      ["Johnson", "Mark", "E005", 250000, 6250, "1983-06-14", "2008-07-20", "Active", "No", "2008-07-20", "No", "No", "", ""],
      ["Williams", "Sarah", "E006", 60000, 0, "1998-12-05", "2022-09-01", "Terminated", "Yes", "2022-09-01", "No", "No", "", ""],
      ["Brown", "Tom", "E007", 80000, 2000, "1990-09-09", "2018-03-15", "Leave", "No", "2018-03-15", "No", "No", "", ""],
      ["Lee", "Emily", "E008", 220000, 5500, "1978-04-25", "2003-02-10", "Active", "No", "2003-02-10", "No", "No", "parent", "Mark Johnson"],
      ["Davis", "Chris", "E009", 45000, 1125, "1995-11-11", "2023-01-05", "Active", "No", "2023-01-05", "No", "No", "", ""],
      ["Clark", "Lisa", "E010", 270000, 6750, "1982-02-02", "2011-06-30", "Active", "No", "2011-06-30", "No", "No", "", ""],
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ACP Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 4. Download Results as CSV -----
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? 0;
    const totalEligible = result["Total Eligible Employees"] ?? 0;
    const totalParticipants = result["Total Participants"] ?? 0;
    const hceEligible = result["HCE Eligible"] ?? 0;
    const hceParticipants = result["HCE Participants"] ?? 0;
    const hceAcp = result["HCE ACP (%)"] ?? 0;
    const nhceEligible = result["NHCE Eligible"] ?? 0;
    const nhceParticipants = result["NHCE Participants"] ?? 0;
    const nhceAcp = result["NHCE ACP (%)"] ?? 0;
    const testResult = result["Test Result"] ?? "N/A";
    const excludedNoPlanEntry = result["Excluded Participants"]?.["No Plan Entry Date"] ?? 0;
    const excludedAfterPlanYear = result["Excluded Participants"]?.["After Plan Year"] ?? 0;
    const excludedManually = result["Excluded Participants"]?.["Excluded Manually"] ?? 0;
    const excludedUnion = result["Excluded Participants"]?.["Union Employees"] ?? 0;
    const excludedPartTime = result["Excluded Participants"]?.["Part-Time/Seasonal"] ?? 0;
    const excludedTerminated = result["Excluded Participants"]?.["Terminated/Inactive"] ?? 0;

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Total Eligible Employees", totalEligible],
      ["Total Participants", totalParticipants],
      ["HCE Eligible", hceEligible],
      ["HCE Participants", hceParticipants],
      ["HCE ACP (%)", formatPercentage(hceAcp)],
      ["NHCE Eligible", nhceEligible],
      ["NHCE Participants", nhceParticipants],
      ["NHCE ACP (%)", formatPercentage(nhceAcp)],
      ["Test Result", testResult],
      ["Excluded - No Plan Entry Date", excludedNoPlanEntry],
      ["Excluded - After Plan Year", excludedAfterPlanYear],
      ["Excluded - Manually", excludedManually],
      ["Excluded - Union Employees", excludedUnion],
      ["Excluded - Part-Time/Seasonal", excludedPartTime],
      ["Excluded - Terminated/Inactive", excludedTerminated],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ACP Test Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 5. Export Results to PDF -----
  const exportToPDF = async (customAiReview) => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    try {
      const finalAIText = customAiReview !== undefined ? customAiReview : aiReview;
      const plan = planYear || "N/A";
      const totalEmployees = result["Total Employees"] ?? 0;
      const totalEligible = result["Total Eligible Employees"] ?? 0;
      const totalParticipants = result["Total Participants"] ?? 0;
      const hceEligible = result["HCE Eligible"] ?? 0;
      const hceParticipants = result["HCE Participants"] ?? 0;
      const hceAcp = result["HCE ACP (%)"] ?? 0;
      const nhceEligible = result["NHCE Eligible"] ?? 0;
      const nhceParticipants = result["NHCE Participants"] ?? 0;
      const nhceAcp = result["NHCE ACP (%)"] ?? 0;
      const testResult = result["Test Result"] ?? "N/A";
      const testCriterion = result["Test Criterion"] ?? "N/A";
      const failed = testResult.toLowerCase() === "failed";

      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // PDF Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("ACP Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${plan}`, 105, 25, { align: "center" });
      const generatedTimestamp = new Date().toLocaleString();
      pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

      // Subheader with test criterion
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        `Test Criterion: ${testCriterion}`,
        105,
        38,
        { align: "center", maxWidth: 180 }
      );

      // Results Table
      pdf.autoTable({
        startY: 48,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", totalEmployees],
          ["Total Eligible Employees", totalEligible],
          ["Total Participants", totalParticipants],
          ["HCE Eligible", hceEligible],
          ["HCE Participants", hceParticipants],
          ["HCE ACP (%)", formatPercentage(hceAcp)],
          ["NHCE Eligible", nhceEligible],
          ["NHCE Participants", nhceParticipants],
          ["NHCE ACP (%)", formatPercentage(nhceAcp)],
          ["Test Result", testResult],
        ],
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 12, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });

      // AI Review Section or Corrective Actions (if test failed)
      if (finalAIText) {
        pdf.autoTable({
          startY: pdf.lastAutoTable.finalY + 10,
          theme: "grid",
          head: [["AI Corrective Actions"]],
          body: [[finalAIText]],
          headStyles: { fillColor: [126, 34, 206], textColor: [255, 255, 255] },
          styles: { fontSize: 11, font: "helvetica" },
          margin: { left: 10, right: 10 },
        });
      } else if (failed) {
        const correctiveActions = [
          "Increase NHCE contributions to raise NHCE ACP.",
          "Limit HCE contributions to meet the ACP limit.",
          "Implement a safe harbor plan design to avoid testing.",
        ];
        const consequences = [
          "Excess contributions may be refunded to HCEs.",
          "Potential tax penalties for non-compliance.",
          "Plan may need corrective distributions.",
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

      const downloadFileName = finalAIText
        ? "AI Reviewed: ACP Test Results.pdf"
        : "ACP Test Results.pdf";

      pdf.save(downloadFileName);

      const pdfBlob = pdf.output("blob");
      await savePdfResultToFirebase({
        fileName: finalAIText ? "AI Reviewed: ACP Test Results" : "ACP Test Results",
        pdfBlob,
        additionalData: {
          planYear,
          testResult,
        },
      });

      console.log("✅ Export and upload complete");
    } catch (error) {
      console.error("❌ Export PDF Error:", error);
      setError(`❌ ${error.message}`);
    }
  };

  // ----- 6. AI Review Handler -----
  const handleRunAIReview = async () => {
    if (!result || !result.acp_summary) {
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
        fileName: "ACP Test",
        signature: signature.trim(),
      });
      const response = await axios.post(`${API_URL}/api/ai-review`, {
        testType: "ACP",
        testData: result.acp_summary,
        signature: signature.trim(),
      });
      const aiText = response.data.analysis;
      setAiReview(aiText);
      await exportToPDF(aiText);
    } catch (error) {
      console.error("Error fetching AI review:", error);
      setError("❌ Error fetching AI review.");
    }
    setLoading(false);
  };

  // ----- 7. Handle Enter Key -----
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && planYear && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // ----- RENDER -----
  return (
    <div
      className="max-w-[625px] mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload ACP Test File
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
            {Array.from({ length: 10 }, (_, i) => 2025 - i).map((year) => (
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
          !file || !planYear
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-400"
        }`}
        disabled={!file || !planYear || loading}
      >
        {loading ? "Uploading..." : "Upload & Save PDF"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* Display results once available */}
      {result && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h2 className="text-xl font-bold text-gray-700 mb-2">Detailed ACP Test Summary</h2>
          <div className="flex justify-between items-center">
            <span>
              <strong>Plan Year:</strong> {planYear}
            </span>
            <span>
              <strong>Test Result:</strong>{" "}
              <span
                className={`px-2 py-1 rounded text-white ${
                  result["Test Result"]?.toLowerCase() === "passed"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              >
                {result?.["Test Result"] ?? "N/A"}
              </span>
            </span>
          </div>

          <h3 className="font-semibold text-gray-700 mt-4">Employee Counts</h3>
          <ul className="list-disc list-inside mt-2">
            <li><strong>Total Employees:</strong> {result["Total Employees"] ?? 0}</li>
            <li><strong>Total Eligible Employees:</strong> {result["Total Eligible Employees"] ?? 0}</li>
            <li><strong>Total Participants:</strong> {result["Total Participants"] ?? 0}</li>
            <li><strong>HCE Eligible:</strong> {result["HCE Eligible"] ?? 0}</li>
            <li><strong>HCE Participants:</strong> {result["HCE Participants"] ?? 0}</li>
            <li><strong>NHCE Eligible:</strong> {result["NHCE Eligible"] ?? 0}</li>
            <li><strong>NHCE Participants:</strong> {result["NHCE Participants"] ?? 0}</li>
          </ul>

          <h3 className="font-semibold text-gray-700 mt-4">Test Results</h3>
          <ul className="list-disc list-inside mt-2">
            <li><strong>HCE ACP:</strong> {formatPercentage(result["HCE ACP (%)"])}</li>
            <li><strong>NHCE ACP:</strong> {formatPercentage(result["NHCE ACP (%)"])}</li>
            <li><strong>Test Criterion:</strong> {result["Test Criterion"] ?? "N/A"}</li>
          </ul>

          <h3 className="font-semibold text-gray-700 mt-4">Excluded Participants</h3>
          <ul className="list-disc list-inside mt-2">
            <li><strong>No Plan Entry Date:</strong> {result["Excluded Participants"]?.["No Plan Entry Date"] ?? 0}</li>
            <li><strong>After Plan Year:</strong> {result["Excluded Participants"]?.["After Plan Year"] ?? 0}</li>
            <li><strong>Excluded Manually:</strong> {result["Excluded Participants"]?.["Excluded Manually"] ?? 0}</li>
            <li><strong>Union Employees:</strong> {result["Excluded Participants"]?.["Union Employees"] ?? 0}</li>
            <li><strong>Part-Time/Seasonal:</strong> {result["Excluded Participants"]?.["Part-Time/Seasonal"] ?? 0}</li>
            <li><strong>Terminated/Inactive:</strong> {result["Excluded Participants"]?.["Terminated/Inactive"] ?? 0}</li>
          </ul>
        </div>
      )}

      {/* AI Review Section */}
      {result?.acp_summary && (
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
            AI Corrective Actions:
          </h4>
          <p className="text-indigo-900">{aiReview}</p>
        </div>
      )}

      {/* Export & Download Buttons */}
      {result && (
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={() => exportToPDF()}
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
      )}

      {/* Corrective Actions & Consequences if Test Failed */}
      {result?.["Test Result"]?.toLowerCase() === "failed" && (
        <div>
          <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
            <h4 className="font-bold text-gray-700">Corrective Actions:</h4>
            <ul className="list-disc list-inside text-gray-700">
              <li>Increase NHCE contributions to raise NHCE ACP.</li>
              <li>Limit HCE contributions to meet the ACP limit.</li>
              <li>Implement a safe harbor plan design to avoid testing.</li>
            </ul>
          </div>
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
            <h4 className="font-bold text-gray-700">Consequences:</h4>
            <ul className="list-disc list-inside text-gray-700">
              <li>Excess contributions may be refunded to HCEs.</li>
              <li>Potential tax penalties for non-compliance.</li>
              <li>Plan may need corrective distributions.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Consent Modal for AI Review */}
      {showConsentModal && (
        <Modal title="AI Review Consent" onClose={() => setShowConsentModal(false)}>
          <p className="mb-4 text-sm text-gray-700">
            By proceeding, you acknowledge that any uploaded data may contain PII and you authorize its redaction and analysis using an AI language model. This is strictly for suggesting corrective actions.
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
              I agree to the processing and redaction of PII through AI.
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
                    fileName: "ACP Test",
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

export default ACPTest;
