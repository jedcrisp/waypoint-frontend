// src/pages/ACPTest.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { 
  savePdfResultToFirebase, 
  saveAIReviewConsent
} from "../utils/firebaseTestSaver";
import Modal from "../components/Modal";
import { useCart } from "../contexts/CartContext";
import { ShoppingCart } from "lucide-react";
import ACPTestBlockedView from "../components/ACPTestBlockedView";
import { removeTestFromPurchased } from "../utils/firebaseTestSaver.js";


const ACPTest = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user?.uid;
  const testId = "acpTest"; // Must match the test ID used in your test catalog and purchase flow

  // ---------- Access Control ----------
  const [accessStatus, setAccessStatus] = useState("loading");
  const [cartMsg, setCartMsg] = useState("");

  // ✅ Define outside the useEffect
async function ensureTestDocExists(userId, testId) {
  const ref = doc(db, "users", userId, "purchasedTests", testId);
  const snap = await getDoc(ref);

  // Only create the doc if it does NOT exist
  if (!snap.exists()) {
    await setDoc(ref, {
      unlocked: true,
      used: false,
      purchasedAt: serverTimestamp(),
    });
    console.log("📦 Test doc created manually");
  } else {
    console.log("✅ Test doc already exists, not overwriting");
  }
}


useEffect(() => {
  async function checkAccessToTestWithRetry(retries = 3, delay = 1500) {
    for (let i = 0; i < retries; i++) {
      const ref = doc(db, "users", userId, "purchasedTests", testId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        const isUnlocked = data.unlocked === true;
        const isUsed = data.used === true;

        console.log("🔁 Access retry check:", { isUnlocked, isUsed });

        if (isUnlocked && !isUsed) {
          setAccessStatus("granted");
          return;
        } else {
          setAccessStatus("used");
          return;
        }
      }

      // wait before retrying
      await new Promise((res) => setTimeout(res, delay));
    }

    setAccessStatus("not-purchased"); // fallback after retries
  }

  if (userId) {
    checkAccessToTestWithRetry();
  } else {
    setAccessStatus("not-purchased");
  }
}, [userId, testId]);


  // ---------- Cart Setup ----------
  const { addToCart } = useCart();

  // ---------- Component State & Helpers ----------
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiReview, setAiReview] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [signature, setSignature] = useState("");
  const [normalPdfExported, setNormalPdfExported] = useState(false); // flag to export normal PDF only once
  const API_URL = import.meta.env.VITE_BACKEND_URL; // Ensure this is set in .env.local

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
      setAiReview("");
      setNormalPdfExported(false); // Reset PDF export flag on new file selection
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv, .xlsx",
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // Reset export flag when a new file is chosen
  useEffect(() => {
    if (!file) {
      setNormalPdfExported(false);
    }
  }, [file]);

  // Helper functions for file processing (downloadCSVTemplate, handleUpload, downloadResultsAsCSV, exportToPDF, etc.)
  // (These are assumed to be defined below or imported; see your previous code for full implementations.)
  
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "Compensation",
        "Employer Match",
        "HCE",
        "DOB",
        "DOH",
        "Employment Status",
        "Excluded from Test",
        "Plan Entry Date",
        "Union Employee",
        "Part-Time / Seasonal",
      ],
      ["Last", "First", "001", 75000, 3750, "No", "1985-04-10", "2010-05-15", "Active", "No", "2011-01-01", "No", "No"],
      ["Last", "First", "002", 120000, 6000, "Yes", "1979-08-22", "2006-03-01", "Active", "No", "2007-01-01", "No", "No"],
      ["Last", "First", "003", 56000, 2800, "No", "1990-01-01", "2021-04-10", "Active", "No", "2022-01-01", "No", "No"],
      ["Last", "First", "004", 98000, 4900, "Yes", "1982-11-30", "2008-06-20", "Active", "No", "2009-01-01", "No", "No"],
      ["Last", "First", "005", 40000, 0, "No", "1998-06-18", "2022-08-05", "Terminated", "No", "2023-01-01", "No", "No"],
      ["Last", "First", "006", 110000, 5500, "Yes", "1986-02-12", "2011-09-01", "Active", "No", "2012-01-01", "No", "No"],
      ["Last", "First", "007", 45000, 2250, "No", "2001-09-15", "2023-03-01", "Active", "No", "2023-07-01", "No", "Yes"],
      ["Last", "First", "008", 105000, 5250, "Yes", "1975-03-05", "2000-02-01", "Leave", "No", "2001-01-01", "No", "No"],
      ["Last", "First", "009", 67000, 3350, "No", "1994-10-20", "2016-05-10", "Active", "No", "2017-01-01", "No", "No"],
      ["Last", "First", "010", 42000, 0, "No", "2002-11-25", "2022-11-15", "Active", "No", "2023-01-01", "No", "No"]
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

  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }
    if (!planYear) {
      setError("❌ Please select a plan year.");
      return;
    }
    const validFileTypes = [".csv", ".xlsx"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    if (!validFileTypes.includes(fileExtension)) {
      setError("❌ Invalid file type. Please upload a CSV or Excel file.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setAiReview("");
    setNormalPdfExported(false);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("selected_tests", "acp");

    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      const response = await axios.post(`${API_URL}/upload-csv/acp`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(response.data["Test Results"]["acp"]);
    } catch (err) {
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const hceAvg = result["HCE ACP (%)"];
    const nhceAvg = result["NHCE ACP (%)"];
    const testResult = result["Test Result"] ?? "N/A";
    const formatPct = (val) =>
      val !== undefined && val !== null && !isNaN(val)
        ? `${Number(val).toFixed(2)}%`
        : "N/A";
    const csvRows = [
      ["Metric", "Value"],
      ["Total Employees", totalEmployees],
      ["Total Participants", totalParticipants],
      ["HCE ACP", formatPct(hceAvg)],
      ["NHCE ACP", formatPct(nhceAvg)],
      ["Test Result", testResult],
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

  const exportToPDF = async (customAiReview) => {
  if (!result) {
    setError("❌ No results available to export.");
    return;
  }

  try {
    const finalAIText = customAiReview !== undefined ? customAiReview : aiReview;
    const totalEmployees = result?.["Total Employees"] || "N/A";
    const totalParticipants = result?.["Total Participants"] || "N/A";
    const hceAvg = result?.["HCE ACP (%)"] !== undefined ? `${result["HCE ACP (%)"]}%` : "N/A";
    const nhceAvg = result?.["NHCE ACP (%)"] !== undefined ? `${result["NHCE ACP (%)"]}%` : "N/A";
    const testResult = result?.["Test Result"] || "N/A";
    const failed = testResult.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("ACP Test Results", 105, 15, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60);
    pdf.text(
      "Test Criterion: IRC §401(m)(2): The ACP test ensures that employer matching and employee after-tax contributions for HCEs are not disproportionately higher than for NHCEs.",
      105,
      38,
      { align: "center", maxWidth: 180 }
    );

    pdf.autoTable({
      startY: 48,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", totalEmployees],
        ["Total Participants", totalParticipants],
        ["HCE ACP (%)", hceAvg],
        ["NHCE ACP (%)", nhceAvg],
        ["Test Result", testResult],
      ],
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      styles: { fontSize: 12, font: "helvetica" },
      margin: { left: 10, right: 10 },
    });

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

    if (failed && !finalAIText) {
      const correctiveActions = [
        "Refund Excess Contributions to HCEs by March 15 to avoid penalties.",
        "Make Additional Contributions to NHCEs via QNEC or QMAC.",
        "Recharacterize Excess HCE Contributions as Employee Contributions.",
      ];
      const consequences = [
        "Excess Contributions Must Be Refunded",
        "IRS Penalties and Compliance Risks",
        "Loss of Tax Benefits for HCEs",
        "Plan Disqualification Risk",
        "Employee Dissatisfaction & Legal Risks",
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
        body: consequences.map((c) => [c]),
        headStyles: { fillColor: [238, 220, 92], textColor: [255, 255, 255] },
        styles: { fontSize: 11, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });
    }

    if (signature.trim()) {
      const sigTime = new Date().toLocaleString();
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Digital Signature: ${signature.trim()}`, 10, 280);
      pdf.text(`Signed on: ${sigTime}`, 10, 285);
    }

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

      const downloadFileName = finalAIText ? "AI Reviewed: ACP Test Results.pdf" : "ACP Test Results.pdf";
      pdf.save(downloadFileName);

      const pdfBlob = pdf.output("blob");
     await savePdfResultToFirebase({
      fileName: downloadFileName,
      pdfBlob,
      additionalData: {
        planYear,
        testResult,
        aiConsent: {
          agreed: !!signature.trim(),
          signature: signature.trim(),
          timestamp: new Date().toISOString(),
        },
      },
    });

    // 🔐 Attempt to lock the test after saving
    try {
      console.log("🔐 Attempting to lock test", { userId, testId });
      const response = await axios.post(`${API_URL}/api/lock-test`, {
        userId,
        testId,
      });
      console.log("✅ Lock test response:", response.data);
    } catch (lockError) {
      console.error("❌ Lock test failed:", lockError.message);
      setError(`❌ Failed to lock test: ${lockError.message}`);
    }

    setAccessStatus("not-purchased");
  } catch (error) {
    setError(`❌ ${error.message}`);
  }
};

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
    setAccessStatus("not-purchased");
  } catch (error) {
    setError(`❌ Error during AI review or test removal: ${error.message}`);
  }
  setLoading(false);
};


  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // ---------- Conditional Rendering ----------
if (accessStatus === "used") {
  return <ACPTestBlockedView addToCart={addToCart} testId="acpTest" />;
}
  // ---------- Render ACP Test Content if Access Granted ----------
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload ACP File
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
          {/* Detailed Test Summary */}
          {result?.acp_summary && (
            <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-md">
              <h4 className="font-bold text-lg text-gray-700 mb-2">
                Detailed ACP Test Summary
              </h4>
              <div className="mb-4 flex justify-between items-center">
                <p>
                  <strong>Plan Year:</strong>{" "}
                  <span className="text-blue-600">{planYear || "N/A"}</span>
                </p>
                <p>
                  <strong>Test Result:</strong>{" "}
                  <span
                    className={`px-2 py-1 rounded-md font-semibold ${
                      result["Test Result"] === "Passed"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {result["Test Result"] || "N/A"}
                  </span>
                </p>
              </div>
              <ul className="list-disc list-inside text-gray-800 mt-2">
                <li>
                  <strong>Total Employees:</strong>{" "}
                  {result["Total Employees"] ?? "N/A"}
                </li>
                <li>
                  <strong>Total Participants:</strong>{" "}
                  {result["Total Participants"] ?? "N/A"}
                </li>
                <li>
                  <strong>Number of HCEs:</strong>{" "}
                  {result.acp_summary.num_hces}
                </li>
                <li>
                  <strong>Number of NHCEs:</strong>{" "}
                  {result.acp_summary.num_nhces}
                </li>
                <li>
                  <strong>HCE Average Contribution:</strong>{" "}
                  {result.acp_summary.hce_avg_contribution}%
                </li>
                <li>
                  <strong>NHCE Average Contribution:</strong>{" "}
                  {result.acp_summary.nhce_avg_contribution}%
                </li>
                <li>
                  <strong>Required Ratio (1.25 x NHCE):</strong>{" "}
                  {result.acp_summary.required_ratio}%
                </li>
                <li>
                  <strong>Actual HCE Contribution:</strong>{" "}
                  {result.acp_summary.actual_ratio}%
                </li>
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
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => exportToPDF()}
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

          {/* Additional info for failed test */}
          {result["Test Result"] &&
            result["Test Result"].toLowerCase() === "failed" && (
              <>
                <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                  <h4 className="font-bold text-black-600">
                    Corrective Actions:
                  </h4>
                  <ul className="list-disc list-inside text-black-600">
                    <li>
                      Refund Excess Contributions to HCEs by March 15 to avoid penalties.
                    </li>
                    <br />
                    <li>
                      Make Additional Contributions to NHCEs via QNEC or QMAC.
                    </li>
                    <br />
                    <li>
                      Recharacterize Excess HCE Contributions as Employee Contributions.
                    </li>
                  </ul>
                </div>

                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                  <h4 className="font-bold text-black-600">
                    Consequences:
                  </h4>
                  <ul className="list-disc list-inside text-black-600">
                    <li>Excess Contributions Must Be Refunded</li>
                    <br />
                    <li>IRS Penalties and Compliance Risks</li>
                    <br />
                    <li>Loss of Tax Benefits for HCEs</li>
                    <br />
                    <li>Plan Disqualification Risk</li>
                    <br />
                    <li>Employee Dissatisfaction &amp; Legal Risks</li>
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
                    fileName: "ACP Test",
                    signature: signature.trim(),
                  });
                  await handleRunAIReview();
                } catch (err) {
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
