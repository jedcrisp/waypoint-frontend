import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { savePdfResultToFirebase, saveAIReviewConsent } from "../utils/firebaseTestSaver";
import Modal from "../components/Modal";

const ADPTest = () => {
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

  // Automatically export PDF after upload if not already exported
  useEffect(() => {
    if (result && !normalPdfExported) {
      exportToPDF();
      setNormalPdfExported(true);
    }
  }, [result, normalPdfExported]);

  // --- 1. Drag & Drop Logic ---
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
      setNormalPdfExported(false); // Reset flag for new upload
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv, .xlsx",
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // --- 2. Upload File ---
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
    formData.append("selected_tests", "adp");

    try {
      console.log("🚀 Uploading file to:", `${API_URL}/upload-csv/adp`);
      console.log("📂 File Selected:", file.name);
      
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      console.log("Firebase Token:", token);

      const response = await axios.post(`${API_URL}/upload-csv/adp`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ Backend response:", response.data);
      const adpResults = response.data;
      if (!adpResults) {
        setError("❌ No ADP test results found in response.");
      } else {
        setResult(adpResults);
      }
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Handle Enter Key ---
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // --- 4. Download CSV Template ---
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      ["Employee ID", "First Name", "Last Name", "DOB", "DOH", "Plan Entry Date", "Termination Date", "Employment Status", "Excluded from Test", "Union Employee", "Part-Time / Seasonal", "Hours Worked", "Compensation", "Employee Deferral", "Deferral Election %", "HCE", "Ownership %", "Family Relationship", "Plan Year", "Eligible for Cafeteria Plan", "Employer Contribution", "Cafeteria Plan Benefits"],
      ["E10001", "Alice", "Smith", "1978-03-15", "2015-06-01", "2015-07-01", "", "Active", "No", "No", "No", "2080", "82000", "4100", "5.0", "No", "0", "", "2024", "Yes", "1500", "3000"],
      ["E10002", "Bob", "Johnson", "1982-11-30", "2012-04-15", "2012-05-01", "2019-08-20", "Terminated", "No", "Yes", "Yes", "1500", "60000", "3000", "5.0", "No", "0", "Spouse", "2024", "No", "1200", "2500"],
      ["E10003", "Carol", "Williams", "1990-06-22", "2018-01-10", "2018-02-01", "", "Active", "Yes", "No", "No", "2080", "92000", "4600", "5.0", "No", "0", "Child", "2025", "Yes", "1800", "3200"],
      ["E10004", "David", "Brown", "1975-09-05", "2010-03-12", "2010-04-01", "", "Active", "No", "No", "No", "2080", "110000", "5500", "5.0", "Yes", "10", "Spouse", "2025", "Yes", "2000", "3500"],
      ["E10005", "Eve", "Jones", "1988-12-10", "2016-08-21", "2016-09-01", "", "Active", "No", "Yes", "No", "2080", "78000", "3900", "5.0", "No", "0", "", "2024", "Yes", "1500", "3000"],
      ["E10006", "Frank", "Miller", "1980-04-18", "2014-11-30", "2014-12-15", "2021-05-10", "Terminated", "Yes", "No", "Yes", "1700", "65000", "3250", "5.0", "No", "0", "Spouse", "2025", "No", "1300", "2600"],
      ["E10007", "Grace", "Davis", "1992-07-14", "2020-01-20", "2020-02-01", "", "Active", "No", "Yes", "No", "2080", "85000", "4250", "5.0", "No", "0", "", "2024", "Yes", "1600", "3000"],
      ["E10008", "Hank", "Garcia", "1979-02-28", "2009-07-01", "2009-08-01", "2018-12-31", "Terminated", "No", "No", "No", "2080", "105000", "5250", "5.0", "Yes", "15", "Spouse", "2025", "No", "2200", "4000"],
      ["E10009", "Ivy", "Rodriguez", "1995-03-30", "2021-06-15", "2021-07-01", "", "Active", "No", "No", "Yes", "1800", "55000", "2750", "5.0", "No", "0", "Child", "2024", "Yes", "1100", "2300"],
      ["E10010", "Jack", "Martinez", "1983-08-11", "2013-05-10", "2013-06-01", "", "Active", "Yes", "No", "No", "2080", "95000", "4750", "5.0", "No", "0", "", "2025", "Yes", "1700", "3100"]
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ADP_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 5. Download Results as CSV ---
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalEligibleEmployees = result["Total Eligible Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const hceEligible = result["HCE Eligible"] ?? "N/A";
    const hceParticipants = result["HCE Participants"] ?? "N/A";
    const hceAdp = result["HCE ADP (%)"] !== undefined ? formatPercentage(result["HCE ADP (%)"]) : "N/A";
    const nhceEligible = result["NHCE Eligible"] ?? "N/A";
    const nhceParticipants = result["NHCE Participants"] ?? "N/A";
    const nhceAdp = result["NHCE ADP (%)"] !== undefined ? formatPercentage(result["NHCE ADP (%)"]) : "N/A";
    const testCriterion = result["Test Criterion"] ?? "N/A";
    const testRes = result["Test Result"] ?? "N/A";
    const breakdown = result["Breakdown"] || {};
    const excludedParticipants = result["Excluded Participants"] || {};

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Total Eligible Employees", totalEligibleEmployees],
      ["Total Participants", totalParticipants],
      ["HCE Eligible", hceEligible],
      ["HCE Participants", hceParticipants],
      ["HCE ADP (%)", hceAdp],
      ["NHCE Eligible", nhceEligible],
      ["NHCE Participants", nhceParticipants],
      ["NHCE ADP (%)", nhceAdp],
      ["Test Criterion", testCriterion],
      ["Test Result", testRes],
      ["HCE Deferral Sum", formatCurrency(breakdown["HCE Deferral Sum"])],
      ["HCE Compensation Sum", formatCurrency(breakdown["HCE Compensation Sum"])],
      ["NHCE Deferral Sum", formatCurrency(breakdown["NHCE Deferral Sum"])],
      ["NHCE Compensation Sum", formatCurrency(breakdown["NHCE Compensation Sum"])],
      ["Excluded - No Plan Entry Date", excludedParticipants["No Plan Entry Date"] ?? "N/A"],
      ["Excluded - After Plan Year", excludedParticipants["After Plan Year"] ?? "N/A"],
      ["Excluded - Manually", excludedParticipants["Excluded Manually"] ?? "N/A"],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ADP_Test_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 6. Export Results to PDF (with Firebase saving) ---
  const exportToPDF = async (customAiReview) => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    try {
      // If AI review text is provided, use it; otherwise, use current aiReview state.
      const finalAIText = customAiReview !== undefined ? customAiReview : aiReview;
      const plan = planYear || "N/A";
      const totalEmployees = result["Total Employees"] ?? "N/A";
      const totalEligibleEmployees = result["Total Eligible Employees"] ?? "N/A";
      const totalParticipants = result["Total Participants"] ?? "N/A";
      const hceEligible = result["HCE Eligible"] ?? "N/A";
      const hceParticipants = result["HCE Participants"] ?? "N/A";
      const hceAdp = result["HCE ADP (%)"] !== undefined ? formatPercentage(result["HCE ADP (%)"]) : "N/A";
      const nhceEligible = result["NHCE Eligible"] ?? "N/A";
      const nhceParticipants = result["NHCE Participants"] ?? "N/A";
      const nhceAdp = result["NHCE ADP (%)"] !== undefined ? formatPercentage(result["NHCE ADP (%)"]) : "N/A";
      const testResult = result["Test Result"] || "N/A";
      const testCriterion = result["Test Criterion"] || "N/A";
      const breakdown = result["Breakdown"] || {};
      const excludedParticipants = result["Excluded Participants"] || {};
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
        "Test Criterion: IRC §401(k)(3): The ADP test ensures that elective deferrals made by HCEs do not exceed 125% of the average deferral rate of NHCEs, or meet alternative safe harbor thresholds (200%/2% or 125%/2%).",
        105,
        38,
        { align: "center", maxWidth: 180 }
      );

      // Results Table
      pdf.autoTable({
        startY: 56,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", totalEmployees],
          ["Total Eligible Employees", totalEligibleEmployees],
          ["Total Participants", totalParticipants],
          ["HCE Eligible", hceEligible],
          ["HCE Participants", hceParticipants],
          ["HCE ADP", hceAdp],
          ["NHCE Eligible", nhceEligible],
          ["NHCE Participants", nhceParticipants],
          ["NHCE ADP", nhceAdp],
          ["Test Criterion", testCriterion],
          ["Test Result", testResult],
        ],
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 12, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });

      // Breakdown Table
      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 10,
        theme: "grid",
        head: [["Breakdown Metric", "Value"]],
        body: [
          ["HCE Deferral Sum", formatCurrency(breakdown["HCE Deferral Sum"])],
          ["HCE Compensation Sum", formatCurrency(breakdown["HCE Compensation Sum"])],
          ["NHCE Deferral Sum", formatCurrency(breakdown["NHCE Deferral Sum"])],
          ["NHCE Compensation Sum", formatCurrency(breakdown["NHCE Compensation Sum"])],
        ],
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 12, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });

      // Excluded Participants Table
      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 10,
        theme: "grid",
        head: [["Excluded Participants", "Count"]],
        body: [
          ["No Plan Entry Date", excludedParticipants["No Plan Entry Date"] ?? "N/A"],
          ["After Plan Year", excludedParticipants["After Plan Year"] ?? "N/A"],
          ["Excluded Manually", excludedParticipants["Excluded Manually"] ?? "N/A"],
        ],
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 12, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });

      // Employee Data Table (optional, shown if not too large)
      if (result["Employee Data"] && result["Employee Data"].length <= 50) {
        pdf.autoTable({
          startY: pdf.lastAutoTable.finalY + 10,
          theme: "grid",
          head: [["Employee ID", "First Name", "Last Name", "Compensation", "Prorated Compensation", "Employee Deferral", "Adjusted Deferral", "Deferral Percentage", "HCE", "Catch-Up Contribution"]],
          body: result["Employee Data"].map(employee => [
            employee["Employee ID"],
            employee["First Name"],
            employee["Last Name"],
            formatCurrency(employee["Compensation"]),
            formatCurrency(employee["Prorated Compensation"]),
            formatCurrency(employee["Employee Deferral"]),
            formatCurrency(employee["Adjusted Deferral"]),
            formatPercentage(employee["Deferral Percentage"]),
            employee["HCE"],
            formatCurrency(employee["Catch-Up Contribution"])
          ]),
          headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
          styles: { fontSize: 8, font: "helvetica" },
          margin: { left: 10, right: 10 },
        });
      }

      // AI Review Section: If AI review text exists, do not add corrective actions.
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
        // If no AI review text and the test failed, add corrective actions & consequences.
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

      // Digital Signature
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
          aiConsent: {
            agreed: !!signature.trim(),
            signature: signature.trim(),
            timestamp: new Date().toISOString(),
          },
        },
      });

      console.log("✅ Export and upload complete");
    } catch (error) {
      console.error("❌ Export PDF Error:", error);
      setError(`❌ ${error.message}`);
    }
  };

  // --- 7. AI Review Handler ---
  const handleRunAIReview = async () => {
    if (!result || !result.adp_summary) {
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
        fileName: "ADP Test",
        signature: signature.trim(),
      });
      const response = await axios.post(`${API_URL}/api/ai-review`, {
        testType: "ADP",
        testData: result.adp_summary,
        signature: signature.trim(),
      });
      const aiText = response.data.analysis;
      setAiReview(aiText);
      // Automatically export PDF with AI review text.
      await exportToPDF(aiText);
    } catch (error) {
      console.error("Error fetching AI review:", error);
      setAiReview("Error fetching AI review.");
    }
    setLoading(false);
  };

  return (
    <div
      className="max-w-3xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload ADP File
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
          isDragActive ? "border-green-500 bg-blue-100" : "border-gray-300 bg-gray-50"
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
        {loading ? "Uploading..." : "Upload & Save PDF"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* All result content only shown after upload */}
      {result && (
        <>
          {/* Detailed ADP Test Summary */}
          {result && (
            <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-md">
              <h4 className="font-bold text-lg text-gray-700 mb-2">
                Detailed ADP Test Summary
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

              {/* Employee Counts */}
              <details className="mb-2">
                <summary className="font-semibold text-gray-700 cursor-pointer">
                  Employee Counts
                </summary>
                <ul className="list-disc list-inside text-gray-800 mt-2 pl-4">
                  <li>
                    <strong>Total Employees:</strong>{" "}
                    {result["Total Employees"] ?? "N/A"}
                  </li>
                  <li>
                    <strong>Total Eligible Employees:</strong>{" "}
                    {result["Total Eligible Employees"] ?? "N/A"}
                  </li>
                  <li>
                    <strong>Total Participants:</strong>{" "}
                    {result["Total Participants"] ?? "N/A"}
                  </li>
                  <li>
                    <strong>HCE Eligible:</strong>{" "}
                    {result["HCE Eligible"] ?? "N/A"}
                  </li>
                  <li>
                    <strong>HCE Participants:</strong>{" "}
                    {result["HCE Participants"] ?? "N/A"}
                  </li>
                  <li>
                    <strong>NHCE Eligible:</strong>{" "}
                    {result["NHCE Eligible"] ?? "N/A"}
                  </li>
                  <li>
                    <strong>NHCE Participants:</strong>{" "}
                    {result["NHCE Participants"] ?? "N/A"}
                  </li>
                </ul>
              </details>

              {/* Test Results */}
              <details className="mb-2">
                <summary className="font-semibold text-gray-700 cursor-pointer">
                  Test Results
                </summary>
                <ul className="list-disc list-inside text-gray-800 mt-2 pl-4">
                  <li>
                    <strong>HCE ADP:</strong>{" "}
                    {formatPercentage(result["HCE ADP (%)"])}
                  </li>
                  <li>
                    <strong>NHCE ADP:</strong>{" "}
                    {formatPercentage(result["NHCE ADP (%)"])}
                  </li>
                  <li>
                    <strong>Test Criterion:</strong>{" "}
                    {result["Test Criterion"] ?? "N/A"}
                  </li>
                </ul>
              </details>

              {/* Breakdown */}
              <details className="mb-2">
                <summary className="font-semibold text-gray-700 cursor-pointer">
                  Breakdown
                </summary>
                <ul className="list-disc list-inside text-gray-800 mt-2 pl-4">
                  <li>
                    <strong>HCE Deferral Sum:</strong>{" "}
                    {formatCurrency(result["Breakdown"]["HCE Deferral Sum"])}
                  </li>
                  <li>
                    <strong>HCE Compensation Sum:</strong>{" "}
                    {formatCurrency(result["Breakdown"]["HCE Compensation Sum"])}
                  </li>
                  <li>
                    <strong>NHCE Deferral Sum:</strong>{" "}
                    {formatCurrency(result["Breakdown"]["NHCE Deferral Sum"])}
                  </li>
                  <li>
                    <strong>NHCE Compensation Sum:</strong>{" "}
                    {formatCurrency(result["Breakdown"]["NHCE Compensation Sum"])}
                  </li>
                </ul>
              </details>

              {/* Excluded Participants */}
              <details className="mb-2">
                <summary className="font-semibold text-gray-700 cursor-pointer">
                  Excluded Participants
                </summary>
                <ul className="list-disc list-inside text-gray-800 mt-2 pl-4">
                  <li>
                    <strong>No Plan Entry Date:</strong>{" "}
                    {result["Excluded Participants"]["No Plan Entry Date"] ?? "N/A"}
                  </li>
                  <li>
                    <strong>After Plan Year:</strong>{" "}
                    {result["Excluded Participants"]["After Plan Year"] ?? "N/A"}
                  </li>
                  <li>
                    <strong>Excluded Manually:</strong>{" "}
                    {result["Excluded Participants"]["Excluded Manually"] ?? "N/A"}
                  </li>
                </ul>
              </details>

              {/* Employee Data Table */}
              <details className="mb-2">
                <summary className="font-semibold text-gray-700 cursor-pointer">
                  Employee Data ({result["Employee Data"]?.length || 0} Employees)
                </summary>
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 border-b">Employee ID</th>
                        <th className="px-4 py-2 border-b">First Name</th>
                        <th className="px-4 py-2 border-b">Last Name</th>
                        <th className="px-4 py-2 border-b">Compensation</th>
                        <th className="px-4 py-2 border-b">Prorated Compensation</th>
                        <th className="px-4 py-2 border-b">Employee Deferral</th>
                        <th className="px-4 py-2 border-b">Adjusted Deferral</th>
                        <th className="px-4 py-2 border-b">Deferral Percentage</th>
                        <th className="px-4 py-2 border-b">HCE</th>
                        <th className="px-4 py-2 border-b">Catch-Up Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result["Employee Data"]?.map((employee, index) => (
                        <tr key={index} className="text-center">
                          <td className="px-4 py-2 border-b">{employee["Employee ID"]}</td>
                          <td className="px-4 py-2 border-b">{employee["First Name"]}</td>
                          <td className="px-4 py-2 border-b">{employee["Last Name"]}</td>
                          <td className="px-4 py-2 border-b">{formatCurrency(employee["Compensation"])}</td>
                          <td className="px-4 py-2 border-b">{formatCurrency(employee["Prorated Compensation"])}</td>
                          <td className="px-4 py-2 border-b">{formatCurrency(employee["Employee Deferral"])}</td>
                          <td className="px-4 py-2 border-b">{formatCurrency(employee["Adjusted Deferral"])}</td>
                          <td className="px-4 py-2 border-b">{formatPercentage(employee["Deferral Percentage"])}</td>
                          <td className="px-4 py-2 border-b">{employee["HCE"]}</td>
                          <td className="px-4 py-2 border-b">{formatCurrency(employee["Catch-Up Contribution"])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}

          {/* AI Review Section */}
          {result?.adp_summary && (
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

          {/* Export & Download Buttons (shown only after upload) */}
          <div className="flex flex-col gap-2 mt-4">
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

          {/* Corrective Actions & Consequences if Test Failed (only if AI review not performed) */}
          {result["Test Result"]?.toLowerCase() === "failed" && !aiReview && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black">
                  <li>Increase NHCE participation to ensure at least 70% of HCE rate.</li>
                  <br />
                  <li>Adjust eligibility criteria to include more NHCEs.</li>
                  <br />
                  <li>Modify plan structure or incentives to encourage NHCE participation.</li>
                  <br />
                  <li>Review plan design to ensure compliance with IRC § 410(b).</li>
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
        </>
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
