import React, { useState, useCallback, useEffect } from "react";
import { savePdfResultToFirebase, saveAIReviewConsent } from "../utils/firebaseTestSaver";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas"; // Optional: for graph export
import Modal from "../components/Modal";

const EligibilityTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
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
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "N/A";
    return `${Number(value).toFixed(2)}%`;
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
    formData.append("selected_tests", "eligibility");
    formData.append("plan_year", planYear);

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
  // 3. AI Review Handler
  // =========================
  const handleRunAIReview = async () => {
    // Assuming your backend sends the test summary in eligibility_summary
    if (!result || !result.eligibility_summary) {
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
        fileName: "Eligibility Test",
        signature: signature.trim(),
      });
      const response = await axios.post(`${API_URL}/api/ai-review`, {
        testType: "Eligibility",
        testData: result.eligibility_summary,
        signature: signature.trim(),
      });
      const aiText = response.data.analysis;
      setAiReview(aiText);
      // Automatically export PDF with AI review text
      await exportToPDF(aiText);
    } catch (error) {
      console.error("Error fetching AI review:", error);
      setAiReview("Error fetching AI review.");
    }
    setLoading(false);
  };

  // =========================
  // 4. Handle Enter Key
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // =========================
  // 5. Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "HCE",
        "DOB",
        "DOH",
        "Eligible for Plan",
        "Employment Status",
        "Excluded from Test",
        "Plan Entry Date",
        "Union Employee",
        "Part-Time / Seasonal"
      ],
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
    link.setAttribute("download", "Cafeteria Eligibility Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 6. Download Results as CSV
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
      ["HCE Count", result["HCE Count"] ?? "N/A"],
      [
        "HCE Percentage",
        result["HCE Percentage (%)"] !== undefined
          ? result["HCE Percentage (%)"] + "%"
          : "N/A"
      ],
      ["Test Result", result["Test Result"] ?? "N/A"],
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Cafeteria Eligibility Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 7. Export to PDF (with Firebase saving)
  // =========================
  // Accepts an optional customAiReview string to include in the PDF.
  const exportToPDF = async (customAiReview) => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    const failed = result["Test Result"]?.toLowerCase() === "failed";
    const finalAIText = customAiReview !== undefined ? customAiReview : aiReview;

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Cafeteria Eligibility Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

      // Subheader with test criterion
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        "Test Criterion: IRC §125(g)(3): At least 70% of all non-excludable employees must be eligible to participate in the cafeteria plan, or the plan must pass one of the alternative eligibility tests.",
        105,
        38,
        { align: "center", maxWidth: 180 }
      );

      // Results Table
      pdf.autoTable({
        startY: 50,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", result["Total Employees"] ?? "N/A"],
          ["Total Participants", result["Total Participants"] ?? "N/A"],
          ["HCE Count", result["HCE Count"] ?? "N/A"],
          [
            "HCE Percentage",
            result["HCE Percentage (%)"] !== undefined
              ? result["HCE Percentage (%)"] + "%"
              : "N/A"
          ],
          ["Test Result", result["Test Result"] ?? "N/A"],
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

      // Corrective Actions & Consequences (if test failed)
      if (failed && !finalAIText) {
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

      // Optionally, add graphs using html2canvas if an element with ID "graphContainer" exists
      const graphElement = document.getElementById("graphContainer");
      if (graphElement) {
        try {
          const canvas = await html2canvas(graphElement, { scale: 2 });
          const graphImgData = canvas.toDataURL("image/png");
          pdf.addPage();
          pdf.setFontSize(14);
          pdf.addImage(graphImgData, "PNG", 10, 30, 190, 100);
        } catch (err) {
          console.error("❌ Graph export failed:", err);
        }
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
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100, 100, 100);
      pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

      // Generate blob and save locally
      const pdfBlob = pdf.output("blob");
      pdf.save("Cafeteria Eligibility Test Results.pdf");

      // Save PDF to Firebase
      await savePdfResultToFirebase({
        fileName: "Cafeteria Eligibility Test Results",
        pdfBlob,
        additionalData: {
          planYear,
          testResult: result["Test Result"] ?? "Unknown",
        },
      });
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }
  };

  // =========================
  // 8. RENDER
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
            className="flex-3 px-4 py-2 border border-gray-300 rounded-md"
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

      {error && <div className="mt-3 text-red-500">{error}</div>}

      {result && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          {/* Detailed Benefit Test Summary */}
          <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-md">
            <h4 className="font-bold text-lg text-gray-700 mb-2">
              Detailed Benefit Test Summary
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
                <strong>HCE Count:</strong>{" "}
                {result?.["HCE Count"] ?? "N/A"}
              </li>
              <li>
                <strong>HCE Percentage:</strong>{" "}
                {result?.["HCE Percentage (%)"] !== undefined
                  ? `${parseFloat(result["HCE Percentage (%)"]).toFixed(2)}%`
                  : "N/A"}
              </li>
            </ul>
          </div>

          {/* AI Review Section */}
          {result?.eligibility_summary && (
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
          <div className="flex flex-col gap-2 mt-2">
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
          {result?.["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-gray-700">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-gray-700">
                  <li>Reallocate benefits to balance distributions.</li>
                  <br />
                  <li>Adjust classifications of key employees.</li>
                  <br />
                  <li>Update contribution policies.</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-gray-700">Consequences:</h4>
                <ul className="list-disc list-inside text-gray-700">
                  <li>Loss of tax-exempt status for key employees.</li>
                  <br />
                  <li>IRS penalties and fines.</li>
                  <br />
                  <li>Risk of plan disqualification.</li>
                </ul>
              </div>
            </>
          )}
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
                    fileName: "Eligibility Test",
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

export default EligibilityTest;
