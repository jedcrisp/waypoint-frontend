import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const SimpleCafeteriaPlanEligibilityTest = () => {
  const [file, setFile] = useState(null);
   const [loading, setLoading] = useState(false);
   const [result, setResult] = useState(null);
   const [error, setError] = useState(null);
   const [planYear, setPlanYear] = useState(""); // Plan year selection state

  const API_URL = import.meta.env.VITE_BACKEND_URL;

   // =========================
   // 1. Drag & Drop Logic
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
  // 2. Upload File to Backend
  // =========================
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }

    // Validate file type (CSV or Excel)
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
    formData.append("selected_tests", "simple_cafeteria_plan_eligibility");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/simple_cafeteria_plan_eligibility`);

      // 1. Get Firebase token
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      console.log("Firebase Token:", token);

      // 2. Send POST request with Bearer token
      const response = await axios.post(`${API_URL}/upload-csv/simple_cafeteria_plan_eligibility`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Full API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["simple_cafeteria_plan_eligibility"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.error || "❌ Failed to upload file. Please check the format and try again.");
      } finally {
        setLoading(false);
      }
    }; // Add this closing brace to properly end the handleUpload function

  // =========================
// 4. Download CSV Template
// =========================
const downloadCSVTemplate = () => {
  // Define the CSV data as an array of arrays
  const csvData = [
    ["Last Name", "First Name", "Employee ID", "Eligible for Cafeteria Plan", "Hours Worked", "Earnings", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test"],
    ["Last", "First", "001", "Yes", "2050", "72000", "No", "1990-04-12", "2020-06-01", "Active", "No"],
    ["Last", "First", "002", "Yes", "1950", "68000", "Yes", "1985-11-03", "2019-01-15", "Active", "No"],
    ["Last", "First", "003", "No", "1800", "45000", "No", "1998-07-22", "2023-03-01", "Active", "No"],
    ["Last", "First", "004", "Yes", "2000", "88000", "Yes", "1979-09-10", "2005-07-12", "Active", "No"],
    ["Last", "First", "005", "No", "1600", "36000", "No", "2000-12-01", "2022-08-20", "Terminated", "No"],
    ["Last", "First", "006", "Yes", "2100", "95000", "No", "1992-05-14", "2021-04-10", "Active", "Yes"],
    ["Last", "First", "007", "No", "1200", "24000", "No", "2002-01-05", "2023-09-10", "Active", "No"],
    ["Last", "First", "008", "Yes", "2080", "72000", "Yes", "1980-03-25", "2015-11-01", "Active", "No"],
    ["Last", "First", "009", "Yes", "2200", "86000", "No", "1995-06-30", "2020-02-01", "Active", "No"],
    ["Last", "First", "010", "No", "1000", "18000", "No", "2003-09-12", "2023-01-10", "Leave", "No"]
  ];

      const csvTemplate = csvData
          .map((row) => row.join(","))
          .join("\n");
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Simple_Cafeteria_Plan_Eligibility_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  const totalEmployees = result["Total Employees"] ?? "N/A";
  const eligibleEmployees = result["Eligible Employees"] ?? "N/A";
  const eligibilityPercentage = result["Eligibility Percentage (%)"] ?? "N/A";
  const hoursRequirementMet = result["Hours Requirement Met"] ?? "N/A";
  const employeeCountThreshold = result["Employee Count Threshold"] ?? "N/A";
  const testResult = result["Test Result"] ?? "N/A";

  // Basic rows for the CSV
  const csvRows = [
    ["Metric", "Value"],
    ["Total Employees", totalEmployees],
    ["Eligible Employees", eligibleEmployees],
    ["Eligibility Percentage (%)", eligibilityPercentage],
    ["Hours Requirement Met", hoursRequirementMet],
    ["Employee Count Threshold", employeeCountThreshold],
    ["Test Result", testResult],
  ];

  // If the test failed, add corrective actions and consequences
  if (testResult.toLowerCase() === "failed") {
    const correctiveActions = [
      "Review employee eligibility criteria to ensure minimum participation is met.",
      "Adjust plan design to include a broader employee base.",
      "Ensure compliance with SIMPLE Cafeteria Plan requirements as outlined in IRC § 125(j).",
    ];
    const consequences = [
      "Loss of Safe Harbor status for the plan.",
      "Potential reclassification of benefits as taxable.",
      "Increased compliance and administrative burdens.",
    ];

    csvRows.push(["", ""]);
    csvRows.push(["Corrective Actions", ""]);
    correctiveActions.forEach((action) => csvRows.push(["", action]));

    csvRows.push(["", ""]);
    csvRows.push(["Consequences", ""]);
    consequences.forEach((item) => csvRows.push(["", item]));
  }

  // Convert array to CSV
  const csvContent = csvRows.map((row) => row.join(",")).join("\n");

  // Create and download the CSV file
  const resultBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const resultUrl = URL.createObjectURL(resultBlob);

  const resultLink = document.createElement("a");
  resultLink.href = resultUrl;
  resultLink.setAttribute("download", "Simple_Cafeteria_Plan_Eligibility_Results.csv"); // Ensure correct file name
  document.body.appendChild(resultLink);
  resultLink.click();
  document.body.removeChild(resultLink);
  };


  // =========================
    // 5. Export Results to PDF (Including Consequences)
    // =========================
    const exportToPDF = () => {
  if (!result) {
    setError("❌ No results available to export.");
    return;
  }

  // Extract data from the result object
  const totalEmployees = result["Total Employees"] ?? "N/A";
  const eligibleEmployees = result["Eligible Employees"] ?? "N/A";
  const eligibilityPercentage = result["Eligibility Percentage (%)"] ?? "N/A";
  const hoursRequirementMet = result["Hours Requirement Met"] ?? "N/A";
  const employeeCountThreshold = result["Employee Count Threshold"] ?? "N/A";
  const testResult = result["Test Result"] ?? "N/A";
  const generatedTimestamp = new Date().toLocaleString();
  pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

  const pdf = new jsPDF("p", "mm", "a4");
  
    // Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("Simple Cafeteria Plan Eligibility Test Results", 105, 15, { align: "center" });
  
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`Plan Year: ${planYear || "N/A"}`, 105, 25, { align: "center" });
  
    // Results Table
    pdf.autoTable({
    startY: 40,
    theme: "grid",
    head: [["Metric", "Value"]],
    body: [
      ["Total Employees", totalEmployees],
      ["Eligible Employees", eligibleEmployees],
      ["Eligibility Percentage (%)", eligibilityPercentage],
      ["Hours Requirement Met", hoursRequirementMet],
      ["Employee Count Threshold", employeeCountThreshold],
      ["Test Result", testResult],
    ],
    headStyles: {
      fillColor: [41, 128, 185], // Blue header
      textColor: [255, 255, 255], // White text
    },
    styles: {
      fontSize: 12,
      font: "helvetica",
    },
    margin: { left: 10, right: 10 },
  });

  const nextY = pdf.lastAutoTable.finalY + 10;
  const failed = testResult.toLowerCase() === "failed";

  // Corrective Actions
  if (failed) {
    pdf.setFillColor(255, 230, 230); // Light red
    pdf.setDrawColor(255, 0, 0); // Red border
    const correctiveBoxHeight = 35;
    pdf.rect(10, nextY, 190, correctiveBoxHeight, "FD");

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(255, 0, 0);
    pdf.text("Corrective Actions", 15, nextY + 8);

    // Bullet Points
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    let bulletY = nextY + 14;
    const lineHeight = 6;

    const correctiveActions = [
      "Review employee eligibility criteria to ensure minimum participation is met.",
      "Adjust plan design to include a broader employee base.",
      "Ensure compliance with SIMPLE Cafeteria Plan requirements as outlined in IRC § 125(j).",
    ];

    correctiveActions.forEach((action) => {
      pdf.text(`• ${action}`, 15, bulletY);
      bulletY += lineHeight;
    });

    // Consequences Box
    const nextBoxY = nextY + correctiveBoxHeight + 5;
    pdf.setFillColor(255, 255, 204); // Light yellow
    pdf.setDrawColor(255, 204, 0); // Gold border
    const consequencesBoxHeight = 40;
    pdf.rect(10, nextBoxY, 190, consequencesBoxHeight, "FD");

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(204, 153, 0); // Dark gold
    pdf.text("Consequences", 15, nextBoxY + 8);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    let bulletY2 = nextBoxY + 14;

    const consequences = [
      "Loss of Safe Harbor status for the plan.",
      "Potential reclassification of benefits as taxable.",
      "Increased compliance and administrative burdens.",
    ];

    consequences.forEach((item) => {
      pdf.text(`• ${item}`, 15, bulletY2);
      bulletY2 += lineHeight;
    });
  }

   // Footer
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(100, 100, 100);
  pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

  // Save the PDF
  pdf.save("Simple_Cafeteria_Plan_Eligibility_Test_Results.pdf");

    };

    // =========================
   // 6. Handle Enter Key
   // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  const downloadResultsAsCSV = () => {
  if (!result) {
    setError("❌ No results available to download.");
    return;
  }

  const csvRows = [
    ["Metric", "Value"],
    ["Total Employees", result["Total Employees"] ?? "N/A"],
    ["Eligible Employees", result["Eligible Employees"] ?? "N/A"],
    ["Eligibility Percentage (%)", result["Eligibility Percentage (%)"] ?? "N/A"],
    ["Hours Requirement Met", result["Hours Requirement Met"] ?? "N/A"],
    ["Earnings Requirement Met", result["Earnings Requirement Met"] ?? "N/A"],
    ["Test Result", result["Test Result"] ?? "N/A"],
    ["Test Criterion", "At least 70% eligibility with Hours Worked ≥ 1000 and Earnings ≥ 5000"],
  ];

  if (result["Test Result"] === "Failed") {
    const correctiveActions = [
      "Review employee eligibility criteria to ensure minimum participation is met.",
      "Adjust plan design to include a broader employee base.",
      "Ensure compliance with SIMPLE Cafeteria Plan requirements as outlined in IRC § 125(j).",
    ];
    const consequences = [
      "Loss of Safe Harbor status for the plan.",
      "Potential reclassification of benefits as taxable.",
      "Increased compliance and administrative burdens.",
    ];

    csvRows.push(["", ""]);
    csvRows.push(["Corrective Actions", ""]);
    correctiveActions.forEach((action) => csvRows.push(["", action]));

    csvRows.push(["", ""]);
    csvRows.push(["Consequences", ""]);
    consequences.forEach((item) => csvRows.push(["", item]));
  }

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
      📂 Upload SIMPLE Cafeteria Plan Eligibility File
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
          className="flex-3 px-4 py-2 border border-gray-300 rounded-md w-full"
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

    {/* Buttons */}
    <div className="flex flex-col gap-2 mt-4">
      <button
        onClick={downloadCSVTemplate}
        className="w-full px-4 py-2 text-white bg-gray-500 hover:bg-gray-600 rounded-md"
      >
        Download CSV Template
      </button>
      <button
        type="button"
        onClick={open}
        className="w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
      >
        Choose File
      </button>
      <button
        onClick={handleUpload}
        className={`w-full px-4 py-2 text-white rounded-md ${
          !file ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-400"
        }`}
        disabled={!file || loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>

    {/* Display Errors */}
    {error && <div className="mt-3 text-red-500">{error}</div>}

    {/* Display Results */}
    {result && (
      <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
        <h3 className="font-bold text-xl text-gray-700">SIMPLE Cafeteria Plan Eligibility Results</h3>
        <div className="mt-4">
          <p>
            <strong>Eligible Employees:</strong> {result?.["Eligible Employees"] ?? "N/A"}
          </p>
          <p>
            <strong>Employee Count Threshold:</strong> {result?.["Employee Count Threshold"] ?? "N/A"}
          </p>
          <p>
            <strong>Hours Requirement Met:</strong> {result?.["Hours Requirement Met"] ?? "N/A"}
          </p>
          <p>
            <strong>Eligibility Percentage (%):</strong> {result?.["Eligibility Percentage (%)"] ?? "N/A"}
          </p>
          <p>
            <strong>Total Employees:</strong> {result?.["Total Employees"] ?? "N/A"}
          </p>
          <p>
            <strong>Test Criterion:</strong> At least 70% eligibility with Hours Worked ≥ 1000 and Earnings ≥ 5000
          </p>
          <p>
            <strong>Test Result:</strong>{" "}
            <span
              className={`px-3 py-1 rounded-md font-bold ${
                result["Test Result"] === "Passed"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {result["Test Result"] ?? "N/A"}
            </span>
          </p>
        </div>

        {/* Export & Download Buttons */}
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={exportToPDF}
            className="w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
            disabled={!result} // Disable if no result
          >
            Export PDF Report
          </button>
          <button
            onClick={downloadResultsAsCSV}
            className={`w-full px-4 py-2 text-white rounded-md ${
              result ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!result} // Disable if no result
          >
            Download CSV Report
          </button>
        </div>
      </div>
    )}
  </div>
  );
};
export default SimpleCafeteriaPlanEligibilityTest;
