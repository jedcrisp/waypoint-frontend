import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { savePdfResultToFirebase, saveAIReviewConsent } from "../utils/firebaseTestSaver";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { ClipLoader } from "react-spinners"; // Import the spinner component

const ACPTest = () => {
  // ----- State -----
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false); // New state for spinner visibility
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [aiReview, setAiReview] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [signature, setSignature] = useState("");
  const [normalPdfExported, setNormalPdfExported] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

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

  // New function to format numbers with commas
  const formatNumber = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "0";
    return Number(value).toLocaleString("en-US");
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
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      setResult(null);
      setError(null);
      setNormalPdfExported(false);
      setAiReview("");

      // Parse the CSV file to extract the plan year
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const data = result.data;
            if (data.length > 0 && data[0].PlanYear) {
              const extractedPlanYear = data[0].PlanYear;
              const validYears = Array.from({ length: 10 }, (_, i) => (2025 - i).toString());
              if (validYears.includes(extractedPlanYear)) {
                setPlanYear(extractedPlanYear);
              } else {
                setError(`❌ Invalid Plan Year (${extractedPlanYear}) in CSV. Please select a year between 2016 and 2025.`);
              }
            }
          },
          error: (err) => {
            console.error("Error parsing CSV:", err);
            setError("❌ Failed to parse CSV file.");
          },
        });
      };
      reader.readAsText(uploadedFile);
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

    // Show spinner after 1 second if the test is still running
    const spinnerTimeout = setTimeout(() => {
      setShowSpinner(true);
    }, 1000);

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
        setShowSpinner(false);
        clearTimeout(spinnerTimeout);
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
      setShowSpinner(false);
      clearTimeout(spinnerTimeout);
    }
  };

  // ----- 3. Route to CSV Builder -----
  const routeToCsvBuilder = () => {
    navigate("/csv-builder", {
      state: {
        selectedTest: "acp",
        planYear: planYear || new Date().getFullYear().toString(),
      },
    });
  };

  // ----- 4. Download Results as CSV -----
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? 0;
    const totalParticipants = result["Total Participants"] ?? 0;
    const hceAvgContribution = result["HCE ACP (%)"] ?? 0;
    const nhceAvgContribution = result["NHCE ACP (%)"] ?? 0;
    const testResult = result["Test Result"] ?? "N/A";
    const excludedUnderAge21 = result["Excluded Participants"]?.["Under Age 21"] ?? 0;
    const excludedUnder1Year = result["Excluded Participants"]?.["Under 1 Year of Service"] ?? 0;
    const excludedNoPlanEntry = result["Excluded Participants"]?.["No Plan Entry Date"] ?? 0;
    const excludedManually = result["Excluded Participants"]?.["Excluded Manually"] ?? 0;
    const excludedNotActive = result["Excluded Participants"]?.["Terminated/Inactive"] ?? 0;
    const excludedUnion = result["Excluded Participants"]?.["Union Employees"] ?? 0;
    const excludedPartTime = result["Excluded Participants"]?.["Part-Time/Seasonal"] ?? 0;
    const excludedTerminated = result["Excluded Participants"]?.["Terminated Before Plan Year"] ?? 0;

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", formatNumber(totalEmployees)],
      ["Total Participants", formatNumber(totalParticipants)],
      ["HCE Avg Contribution (%)", formatPercentage(hceAvgContribution)],
      ["NHCE Avg Contribution (%)", formatPercentage(nhceAvgContribution)],
      ["Test Result", testResult],
      ["Excluded - Under Age 21", formatNumber(excludedUnderAge21)],
      ["Excluded - Under 1 Year of Service", formatNumber(excludedUnder1Year)],
      ["Excluded - No Plan Entry Date", formatNumber(excludedNoPlanEntry)],
      ["Excluded - Manually", formatNumber(excludedManually)],
      ["Excluded - Not Active", formatNumber(excludedNotActive)],
      ["Excluded - Union Employees", formatNumber(excludedUnion)],
      ["Excluded - Part-Time/Seasonal", formatNumber(excludedPartTime)],
      ["Excluded - Terminated Before Plan Year", formatNumber(excludedTerminated)],
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
      const totalParticipants = result["Total Participants"] ?? 0;
      const hceAvgContribution = result["HCE ACP (%)"] ?? 0;
      const nhceAvgContribution = result["NHCE ACP (%)"] ?? 0;
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
         "Test Criterion: IRC 401(m)(2): The ACP test ensures that employer matching and employee after-tax contributions for HCEs are not disproportionately higher than for NHCEs.",
        105,
        38,
        { align: "center", maxWidth: 180 }
      );

      // Results Table
      pdf.autoTable({
        startY: 52,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", formatNumber(totalEmployees)],
          ["Total Participants", formatNumber(totalParticipants)],
          ["HCE Avg Contribution (%)", formatPercentage(hceAvgContribution)],
          ["NHCE Avg Contribution (%)", formatPercentage(nhceAvgContribution)],
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
          head: [["AI Corrective Actions (Powered by OpenAI)"]],
          body: [[finalAIText]],
          headStyles: { fillColor: [126, 34, 206], textColor: [255, 255, 255] },
          styles: { fontSize: 11, font: "helvetica" },
          margin: { left: 10, right: 10 },
        });
      } else if (failed) {
        const correctiveActions = [
          "Increase NHCE contributions to raise their average contribution percentage.",
          "Limit HCE contributions to meet the 2% spread requirement.",
          "Review plan design to ensure compliance with ACP test rules.",
        ];
        const consequences = [
          "Excess contributions may need to be refunded to HCEs.",
          "Potential tax penalties for non-compliance.",
          "Plan may face corrective actions or disqualification risks.",
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

      {/* Loading Spinner */}
      {showSpinner && (
        <div className="flex justify-center mt-4">
          <ClipLoader color="#36D7B7" loading={showSpinner} size={50} />
        </div>
      )}

      {/* Download CSV Template Button */}
      <button
        onClick={routeToCsvBuilder}
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
            <li><strong>Total Employees:</strong> {formatNumber(result["Total Employees"] ?? 0)}</li>
            <li><strong>Total Participants:</strong> {formatNumber(result["Total Participants"] ?? 0)}</li>
            <li><strong>HCE Eligible:</strong> {formatNumber(result["HCE Eligible"] ?? 0)}</li>
            <li><strong>HCE Participants:</strong> {formatNumber(result["HCE Participants"] ?? 0)}</li>
            <li><strong>NHCE Eligible:</strong> {formatNumber(result["NHCE Eligible"] ?? 0)}</li>
            <li><strong>NHCE Participants:</strong> {formatNumber(result["NHCE Participants"] ?? 0)}</li>
          </ul>

          <h3 className="font-semibold text-gray-700 mt-4">Test Results</h3>
          <ul className="list-disc list-inside mt-2">
            <li><strong>HCE Avg Contribution:</strong> {formatPercentage(result["HCE ACP (%)"])}</li>
            <li><strong>NHCE Avg Contribution:</strong> {formatPercentage(result["NHCE ACP (%)"])}</li>
            <li><strong>Test Criterion:</strong> {result["Test Criterion"] ?? "N/A"}</li>
            <li><strong>Test Result:</strong> {result["Test Result"] ?? "N/A"}</li>
          </ul>

          <h3 className="font-semibold text-gray-700 mt-4">Excluded Participants</h3>
          <ul className="list-disc list-inside mt-2">
            <li><strong>Under Age 21:</strong> {formatNumber(result["Excluded Participants"]?.["Under Age 21"] ?? 0)}</li>
            <li><strong>Under 1 Year of Service:</strong> {formatNumber(result["Excluded Participants"]?.["Under 1 Year of Service"] ?? 0)}</li>
            <li><strong>No Plan Entry Date:</strong> {formatNumber(result["Excluded Participants"]?.["No Plan Entry Date"] ?? 0)}</li>
            <li><strong>Excluded Manually:</strong> {formatNumber(result["Excluded Participants"]?.["Excluded Manually"] ?? 0)}</li>
            <li><strong>Not Active:</strong> {formatNumber(result["Excluded Participants"]?.["Terminated/Inactive"] ?? 0)}</li>
            <li><strong>Union Employees:</strong> {formatNumber(result["Excluded Participants"]?.["Union Employees"] ?? 0)}</li>
            <li><strong>Part-Time/Seasonal:</strong> {formatNumber(result["Excluded Participants"]?.["Part-Time/Seasonal"] ?? 0)}</li>
            <li><strong>Terminated Before Plan Year:</strong> {formatNumber(result["Excluded Participants"]?.["Terminated Before Plan Year"] ?? 0)}</li>
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
            AI Corrective Actions (Powered by OpenAI):
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
              <li>Increase NHCE contributions to raise their average contribution percentage.</li>
              <li>Limit HCE contributions to meet the 2% spread requirement.</li>
              <li>Review plan design to ensure compliance with ACP test rules.</li>
            </ul>
          </div>
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
            <h4 className="font-bold text-gray-700">Consequences:</h4>
            <ul className="list-disc list-inside text-gray-700">
              <li>Excess contributions may need to be refunded to HCEs.</li>
              <li>Potential tax penalties for non-compliance.</li>
              <li>Plan may face corrective actions or disqualification risks.</li>
            </ul>
          </div>
        </div>
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
