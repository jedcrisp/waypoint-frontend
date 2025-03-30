import React, { useState, useCallback } from "react";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Firebase PDF saver
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const SimpleCafeteriaPlanEligibilityTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // --- Formatting Helpers ---
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "N/A";
    return Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) return "N/A";
    return `${Number(value).toFixed(2)}%`;
  };

  // --- 1. Drag & Drop Logic ---
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

  // --- 2. Upload File to Backend ---
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
    formData.append("selected_tests", "simple_cafeteria_plan_eligibility");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/simple_cafeteria_plan_eligibility`);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      const response = await axios.post(
        `${API_URL}/upload-csv/simple_cafeteria_plan_eligibility`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResult(response.data?.["Test Results"]?.["simple_cafeteria_plan_eligibility"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Download CSV Template ---
  const downloadCSVTemplate = () => {
    const csvData = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "Eligible for Cafeteria Plan",
        "Hours Worked",
        "Earnings",
        "HCE",
        "DOB",
        "DOH",
        "Employment Status",
        "Union Employee",
        "Excluded from Test",
        "Plan Entry Date",
        "Part-Time / Seasonal",
      ],
      ["Last", "First", "001", "Yes", "2050", "72000", "No", "1990-04-12", "2020-06-01", "Active", "No", "No", "2016-01-01", "No"],
      ["Last", "First", "002", "Yes", "1950", "68000", "Yes", "1985-11-03", "2019-01-15", "Active", "No", "No", "2022-04-04", "No"],
      ["Last", "First", "003", "No", "1800", "45000", "No", "1998-07-22", "2023-03-01", "Active", "No", "No", "2023-03-01", "No"],
      ["Last", "First", "004", "Yes", "2100", "80000", "Yes", "1980-02-18", "2018-05-10", "Active", "No", "No", "2018-06-01", "No"],
      ["Last", "First", "005", "Yes", "2080", "75000", "No", "1991-09-30", "2017-09-01", "Active", "No", "No", "2017-10-01", "No"],
      ["Last", "First", "006", "No", "1700", "42000", "No", "1995-06-14", "2022-02-15", "Active", "No", "No", "2022-03-01", "No"],
      ["Last", "First", "007", "Yes", "2000", "69000", "No", "1983-12-12", "2010-04-20", "Active", "Yes", "No", "2010-05-01", "Yes"],
      ["Last", "First", "008", "Yes", "2150", "88000", "Yes", "1979-05-09", "2005-03-10", "Active", "No", "No", "2005-04-01", "No"],
      ["Last", "First", "009", "No", "1600", "39000", "No", "1999-01-01", "2023-06-01", "Active", "No", "No", "2023-06-01", "No"],
      ["Last", "First", "010", "Yes", "1980", "70000", "Yes", "1987-08-23", "2012-08-15", "Active", "No", "No", "2012-09-01", "No"],
    ];
    const csvTemplate = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Simple_Cafeteria_Plan_Eligibility_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 4. Export Results to PDF with Firebase Storage Integration ---
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    let pdfBlob;
    try {
      const totalEmployees = result["Total Employees"] ?? "N/A";
      const totalParticipants = result["Total Participants"] ?? "N/A";
      const hoursRequirementMet = result["Hours Requirement Met"] ?? "N/A";
      const earningsRequirementMet = result["Earnings Requirement Met"] ?? "N/A";
      const eligibilityPct = result["Eligibility Percentage (%)"] !== undefined
        ? formatPercentage(result["Eligibility Percentage (%)"])
        : "N/A";
      const testResult = result["Test Result"] ?? "N/A";
      const failed = testRes.toLowerCase() === "failed";

      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Simple Cafeteria Plan Eligibility Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear || "N/A"}`, 105, 25, { align: "center" });
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

      // Results Table
      pdf.autoTable({
        startY: 40,
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", totalEmployees],
          ["Total Participants", totalParticipants],
          ["Hours Requirement Met", hoursRequirementMet],
          ["Earnings Requirement Met", earningsRequirementMet],
          ["Eligibility Percentage (%)", eligibilityPct],
          ["Test Result", testResult],
        ],
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 12, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });

      // If test failed, add corrective actions & consequences
      if (failed) {
        const correctiveActions = [
          "Review employee eligibility criteria.",
          "Recalculate benefit allocations for compliance.",
          "Amend plan documents to clarify classification rules.",
          "Consult with legal or tax advisors for corrections.",
        ];
        const consequences = [
          "Loss of tax-exempt status for key employees.",
          "IRS compliance violations and penalties.",
          "Plan disqualification risks.",
          "Employee dissatisfaction and legal risks.",
        ];
        pdf.autoTable({
          startY: pdf.lastAutoTable.finalY + 10,
          head: [["Corrective Actions"]],
          body: correctiveActions.map((action) => [action]),
          headStyles: { fillColor: [255, 0, 0], textColor: [255, 255, 255] },
          styles: { fontSize: 11, font: "helvetica" },
          margin: { left: 10, right: 10 },
        });
        pdf.autoTable({
          startY: pdf.lastAutoTable.finalY + 10,
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
        pdf.save("Simple_Cafeteria_Plan_Eligibility_Test_Results.pdf");
      } catch (error) {
        setError(`❌ Error exporting PDF: ${error.message}`);
        return;
      }
      try {
        await savePdfResultToFirebase({
          fileName: "Simple Cafeteria Plan Eligibility",
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

  // --- 5. Download Results as CSV ---
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const hoursRequirementMet = result["Hours Requirement Met"] ?? "N/A";
    const earningsRequirementMet = result["Earnings Requirement Met"] ?? "N/A";
    const eligibilityPct = result["Eligibility Percentage (%)"] !== undefined
      ? formatPercentage(result["Eligibility Percentage (%)"])
      : "N/A";
    const testResult = result["Test Result"] ?? "N/A";
    const failed = testRes.toLowerCase() === "failed";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Total Participants", totalParticipants],
      ["Hours Requirement Met", hoursRequirementMet],
      ["Earnings Requirement Met", earningsRequirementMet],
      ["Eligible Employees", eligibleEmployees],
      ["Eligibility Percentage (%)", eligibilityPct],
      ["Test Result", testResult],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Simple_Cafeteria_Plan_Eligibility_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 6. Handle Enter Key ---
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // --- 7. Render ---
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload SIMPLE Cafeteria Plan Eligibility File
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
        <input type="file" accept=".csv, .xlsx" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
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
          <h3 className="font-bold text-xl text-gray-700">
            Simple Cafeteria Plan Eligibility Results
          </h3>
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
                <strong>Hours Requirement Met:</strong>{" "}
                <span className="font-semibold text-black-600">
                {result?.["Hours Requirement Met"] !== undefined
                  ? (result["Hours Requirement Met"] ? "True" : "False")
                : "N/A"}
            </span>
            </p>
            <p className="text-lg mt-2">
                <strong>Earnings Requirement Met:</strong>{" "}
                  <span className="font-semibold text-black-600">
                {result?.["Earnings Requirement Met"] !== undefined
                ? (result["Earnings Requirement Met"] ? "True" : "False")
                : "N/A"}
            </span>
            </p>
            <p className="text-lg mt-2">
              <strong>Eligibility Percentage:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Eligibility Percentage (%)"] !== undefined
                  ? result["Eligibility Percentage (%)"] + "%"
                  : "N/A"}
              </span>
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

          {/* Corrective Actions & Consequences if Test Failed */}
          {result?.["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Review and verify employee classifications.</li>
                  <br />
                  <li>Recalculate benefit allocations for compliance.</li>
                  <br />
                  <li>Amend plan documents to clarify classification rules.</li>
                  <br />
                  <li>Consult with legal or tax advisors for corrections.</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Loss of tax-exempt status for key employees.</li>
                  <br />
                  <li>IRS compliance violations and penalties.</li>
                  <br />
                  <li>Plan disqualification risks.</li>
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

export default SimpleCafeteriaPlanEligibilityTest;
