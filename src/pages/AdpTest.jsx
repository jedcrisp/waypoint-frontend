import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { savePdfResultToFirebase, saveAIReviewConsent } from "../utils/firebaseTestSaver";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners"; // Import the spinner component

const ADPTest = () => {
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
  const [violatorsCsvDownloaded, setViolatorsCsvDownloaded] = useState(false); // Track if violators CSV was downloaded
  const [updatedViolatorsCsv, setUpdatedViolatorsCsv] = useState(null); // Store the updated violators CSV file
  const [isDragging, setIsDragging] = useState(false);

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

  // Function to format numbers with commas
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

  // ----- 1. Drag & Drop Logic for Initial CSV -----
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
      setNormalPdfExported(false);
      setAiReview("");
      setViolatorsCsvDownloaded(false);
      setUpdatedViolatorsCsv(null);
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
    formData.append("selected_tests", "adp");
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
      const adpResults = response.data?.adp;
      if (!adpResults) {
        setError("❌ No ADP test results found in response.");
      } else {
        setResult(adpResults);
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
        selectedTest: "adp",
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
    const totalEligible = result["Total Eligible Employees"] ?? 0;
    const totalParticipants = result["Total Participants"] ?? 0;
    const hceEligible = result["HCE Eligible"] ?? 0;
    const hceParticipants = result["HCE Participants"] ?? 0;
    const hceAdp = result["HCE ADP (%)"] ?? 0;
    const nhceEligible = result["NHCE Eligible"] ?? 0;
    const nhceParticipants = result["NHCE Participants"] ?? 0;
    const nhceAdp = result["NHCE ADP (%)"] ?? 0;
    const testResult = result["Test Result"] ?? "N/A";
    const excludedNoPlanEntry = result["Excluded Participants"]?.["No Plan Entry Date"] ?? 0;
    const excludedAfterPlanYear = result["Excluded Participants"]?.["After Plan Year"] ?? 0;
    const excludedManually = result["Excluded Participants"]?.["Excluded Manually"] ?? 0;

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", formatNumber(totalEmployees)],
      ["Total Eligible Employees", formatNumber(totalEligible)],
      ["Total Participants", formatNumber(totalParticipants)],
      ["HCE Eligible", formatNumber(hceEligible)],
      ["HCE Participants", formatNumber(hceParticipants)],
      ["HCE ADP (%)", formatPercentage(hceAdp)],
      ["NHCE Eligible", formatNumber(nhceEligible)],
      ["NHCE Participants", formatNumber(nhceParticipants)],
      ["NHCE ADP (%)", formatPercentage(nhceAdp)],
      ["Test Result", testResult],
      ["Excluded - No Plan Entry Date", formatNumber(excludedNoPlanEntry)],
      ["Excluded - After Plan Year", formatNumber(excludedAfterPlanYear)],
      ["Excluded - Manually", formatNumber(excludedManually)],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ADP Test Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 5. Download Violators CSV -----
  const downloadViolatorsCSV = async (csvContent) => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        return;
      }

      const response = await axios.post(
        `${API_URL}/download-violators-csv/adp`,
        { violators_csv_content: csvContent },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob', // Important for file downloads
        }
      );

      // Create a blob URL and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'adp_violators.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Mark that the violators CSV has been downloaded
      setViolatorsCsvDownloaded(true);
    } catch (error) {
      console.error('Error downloading violators CSV:', error);
      setError('❌ Failed to download violators CSV. Check the console for details.');
    }
  };

  // ----- 6. Handle Updated Violators CSV Upload -----
  const handleUpdatedViolatorsCsvUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      const fileType = uploadedFile.name.split(".").pop().toLowerCase();
      if (fileType !== "csv") {
        setError("❌ Please upload a CSV file for the updated violators.");
        return;
      }
      setUpdatedViolatorsCsv(uploadedFile);
      setError(null);
    }
  };

  // ----- 7. Export Results to PDF -----
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
      const hceAdp = result["HCE ADP (%)"] ?? 0;
      const nhceEligible = result["NHCE Eligible"] ?? 0;
      const nhceParticipants = result["NHCE Participants"] ?? 0;
      const nhceAdp = result["NHCE ADP (%)"] ?? 0;
      const testResult = result["Test Result"] ?? "N/A";
      const testCriterion = result["Test Criterion"] ?? "N/A";
      const failed = testResult.toLowerCase() === "failed";

      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // PDF Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("ADP Test Results", 105, 15, { align: "center" });
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
        "Test Criterion: IRC 401(k)(3): The ADP test ensures that elective deferrals made by HCEs do not exceed 125% of the average deferral rate of NHCEs, or meet alternative safe harbor thresholds (200%/2% or 125%/2%).",
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
          ["Total Employees", formatNumber(totalEmployees)],
          ["Total Eligible Employees", formatNumber(totalEligible)],
          ["Total Participants", formatNumber(totalParticipants)],
          ["HCE Eligible", formatNumber(hceEligible)],
          ["HCE Participants", formatNumber(hceParticipants)],
          ["HCE ADP (%)", formatPercentage(hceAdp)],
          ["NHCE Eligible", formatNumber(nhceEligible)],
          ["NHCE Participants", formatNumber(nhceParticipants)],
          ["NHCE ADP (%)", formatPercentage(nhceAdp)],
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
        ? "AI Reviewed: ADP Test Results.pdf"
        : "ADP Test Results.pdf";

      pdf.save(downloadFileName);

      const pdfBlob = pdf.output("blob");
      await savePdfResultToFirebase({
        fileName: finalAIText ? "AI Reviewed: ADP Test Results" : "ADP Test Results",
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

  // ----- 8. AI Review Handler -----
  const handleRunAIReview = async () => {
    if (!result || !result.adp_summary) {
      setError("❌ No test summary available for AI review.");
      return;
    }
    if (!consentChecked || !signature.trim()) {
      setShowConsentModal(true);
      return;
    }
    if (!updatedViolatorsCsv) {
      setError("❌ Please upload the updated violators CSV before running AI review.");
      return;
    }

    setLoading(true);
    try {
      await saveAIReviewConsent({
        fileName: "ADP Test",
        signature: signature.trim(),
      });

      // Read the updated violators CSV content
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csvText = event.target.result;
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken(true);

        try {
          const response = await axios.post(
            `${API_URL}/api/ai-review`,
            {
              testType: "ADP",
              testData: result.adp_summary,
              signature: signature.trim(),
              updatedViolatorsCsv: csvText, // Send the updated CSV content
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const aiText = response.data.analysis;
          setAiReview(aiText);
          await exportToPDF(aiText);
        } catch (error) {
          console.error("Error fetching AI review:", error);
          setError("❌ Error fetching AI review.");
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError("❌ Error reading the updated violators CSV.");
        setLoading(false);
      };
      reader.readAsText(updatedViolatorsCsv);
    } catch (error) {
      console.error("Error saving consent or initiating AI review:", error);
      setError("❌ Error processing AI review consent.");
      setLoading(false);
    }
  };

  // ----- 9. Handle Enter Key -----
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
        📂 Upload ADP Test File
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

      {/* Main CSV Upload Area */}
      <div
        className={`w-full border-2 border-dashed rounded-md p-6 text-center transition-colors ${
          isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
        }`}
        onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        onDrop={e => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
              onDrop([file]);
            } else {
              setError('Please upload a CSV file');
            }
          }
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-600 mb-2">
            Drag and drop your CSV file here, or click to browse
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={e => onDrop(e.target.files)}
            className="hidden"
            id="main-csv-upload"
          />
          <label
            htmlFor="main-csv-upload"
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 cursor-pointer transition-colors"
          >
            Browse Files
          </label>
          {file && (
            <p className="mt-2 text-green-600 font-semibold">{file.name}</p>
          )}
        </div>
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
        className="mt-4 w-full px-4 py-2 text-white bg-blue-500 hover:bg-gray-600 rounded-md"
      >
        CSV Builder
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
          <h2 className="text-xl font-bold text-gray-700 mb-2">Detailed ADP Test Summary</h2>
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
            <li><strong>Total Eligible Employees:</strong> {formatNumber(result["Total Eligible Employees"] ?? 0)}</li>
            <li><strong>Total Participants:</strong> {formatNumber(result["Total Participants"] ?? 0)}</li>
            <li><strong>HCE Eligible:</strong> {formatNumber(result["HCE Eligible"] ?? 0)}</li>
            <li><strong>HCE Participants:</strong> {formatNumber(result["HCE Participants"] ?? 0)}</li>
            <li><strong>NHCE Eligible:</strong> {formatNumber(result["NHCE Eligible"] ?? 0)}</li>
            <li><strong>NHCE Participants:</strong> {formatNumber(result["NHCE Participants"] ?? 0)}</li>
          </ul>

          <h3 className="font-semibold text-gray-700 mt-4">Test Results</h3>
          <ul className="list-disc list-inside mt-2">
            <li><strong>HCE ADP:</strong> {formatPercentage(result["HCE ADP (%)"])}</li>
            <li><strong>NHCE ADP:</strong> {formatPercentage(result["NHCE ADP (%)"])}</li>
            <li><strong>Test Criterion:</strong> {result["Test Criterion"] ?? "N/A"}</li>
          </ul>

          <h3 className="font-semibold text-gray-700 mt-4">Excluded Participants</h3>
          <ul className="list-disc list-inside mt-2">
            <li><strong>No Plan Entry Date:</strong> {formatNumber(result["Excluded Participants"]?.["No Plan Entry Date"] ?? 0)}</li>
            <li><strong>After Plan Year:</strong> {formatNumber(result["Excluded Participants"]?.["After Plan Year"] ?? 0)}</li>
            <li><strong>Excluded Manually:</strong> {formatNumber(result["Excluded Participants"]?.["Excluded Manually"] ?? 0)}</li>
          </ul>
        </div>
      )}

      {/* Violators CSV Section (Moved Outside Results Box) */}
      {result && result["Test Result"]?.toLowerCase() === "failed" && result.violators_csv_content && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Violators CSV Workflow</h3>
          <button
            onClick={() => downloadViolatorsCSV(result.violators_csv_content)}
            className="w-full px-4 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-md"
          >
            Download Violators CSV
          </button>

          {/* Upload Updated Violators CSV */}
          {violatorsCsvDownloaded && (
            <div className="mt-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Upload Violators CSV:
              </label>
              <p className="text-sm text-gray-600 mb-2">
                To run the AI Review, first download the Violators CSV file. Then, upload the file below and click 'Run AI Review' to begin.
              </p>
              <div
                className={`w-full border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                  isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                }`}
                onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    const file = files[0];
                    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                      handleUpdatedViolatorsCsvUpload({ target: { files: [file] } });
                    } else {
                      setError('Please upload a CSV file');
                    }
                  }
                }}
              >
                <div className="flex flex-col items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-gray-600 mb-2">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleUpdatedViolatorsCsvUpload}
                    className="hidden"
                    id="violators-csv-upload"
                  />
                  <label
                    htmlFor="violators-csv-upload"
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 cursor-pointer transition-colors"
                  >
                    Browse Files
                  </label>
                  {updatedViolatorsCsv && (
                    <p className="mt-2 text-green-600 font-semibold">
                      Selected file: {updatedViolatorsCsv.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Review Section */}
      {result?.adp_summary && (
        <div className="mt-6">
          <button
            onClick={handleRunAIReview}
            disabled={loading || !violatorsCsvDownloaded || !updatedViolatorsCsv}
            className={`w-full px-4 py-2 text-white rounded-md ${
              loading || !violatorsCsvDownloaded || !updatedViolatorsCsv
                ? "bg-purple-500 opacity-50 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600"
            }`}
          >
            {loading ? "Processing AI Review..." : "Run AI Review"}
          </button>
          {result["Test Result"]?.toLowerCase() === "failed" && (
            <p className="mt-2 text-sm text-gray-600">
            </p>
          )}
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

      {/* Consent Modal for AI Review */}
      {showConsentModal && (
        <Modal title="AI Review Consent" onClose={() => setShowConsentModal(false)}>
          <p className="mb-4 text-sm text-gray-700">
            By proceeding, you acknowledge that any uploaded data may contain PII and you authorize its redaction and analysis using AI's language model. This is strictly for suggesting corrective actions.
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
                    fileName: "ADP Test",
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

export default ADPTest;
