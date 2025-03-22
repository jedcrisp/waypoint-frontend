import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import CsvTemplateDownloader from "../components/CsvTemplateDownloader"; // Adjust the path as needed
import jsPDF from "jspdf";
import "jspdf-autotable";

const DCAPEligibilityTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year selection state

  const API_URL = import.meta.env.VITE_BACKEND_URL; // Ensure this is the correct URL for your backend

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
    accept: ".csv, .xlsx", // Supports both CSV and Excel files
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

    // Validate file extension
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
    formData.append("selected_tests", "dcap_eligibility"); // Add the selected_tests parameter

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/dcap_eligibility`);
      console.log("📂 File Selected:", file.name);

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
      const response = await axios.post(`${API_URL}/upload-csv/dcap_eligibility`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ API Response:", response.data);
      setResult(response.data["Test Results"]["dcap_eligibility"]);
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 3. Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      ["Name", "HCE", "Eligible for DCAP"],
      ["Example Employee 1", "Yes",  "Yes"],
      ["Example Employee 2", "No",   "No"],
      ["Example Employee 3", "Yes",  "No"],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "DCAP_Eligibilty_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 4. Download Results as CSV (Including Consequences)
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    const totalEmployees = result["Total Employees"] ?? "N/A";
    const eligibleEmployees = result["Eligible Employees"] ?? "N/A";
    const dcapEligibilityPercentage = result["DCAP Eligibility Percentage (%)"] ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";


    // Basic rows for HCE/NHCE
    const csvRows = [
      ["Metric", "Value"],
      ["Total Employees", totalEmployees],
      ["Eligible Employees", eligibleEmployees],
      ["DCAP Eligibility Percentage (%)", dcapEligibilityPercentage],
      ["Test Result", testResult],
    ];

    // If failed, add corrective actions + consequences
    if (testResult.toLowerCase() === "failed") {
      const correctiveActions = [
        "Expand Eligibility for NHCEs: Remove restrictive criteria that exclude NHCEs from participating in DCAP.",
        "Increase NHCE Participation: Improve education and awareness, offer enrollment incentives, and simplify the sign-up process.",
        "Adjust Employer Contributions: Ensure employer contributions are evenly distributed among HCEs and NHCEs.",
        "Amend the Plan Document: Modify eligibility and contribution rules to align with IRS nondiscrimination requirements.",
      ];

      const consequences = [
        "Potential IRS penalties or plan disqualification.",
        "Potential disqualification of the Health FSA plan.",
        "Loss of tax-free DCAP benefits for employees.",
      ];

      // Add a blank row for spacing
      csvRows.push(["", ""]);
      csvRows.push(["Corrective Actions", ""]);

      correctiveActions.forEach((action) => {
        csvRows.push(["", action]);
      });

      // Another blank row
      csvRows.push(["", ""]);
      csvRows.push(["Consequences", ""]);

      consequences.forEach((item) => {
        csvRows.push(["", item]);
      });
    }

    // Convert array to CSV
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "DCAP_Eligibility_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  const dcapEligibilityPercentage = result["DCAP Eligibility Percentage (%)"] ?? "N/A";
  const testResult = result["Test Result"] ?? "N/A";

  const pdf = new jsPDF("p", "mm", "a4");

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("DCAP Eligibility Test Results", 105, 15, { align: "center" });

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
      ["DCAP Eligibility Percentage (%)", dcapEligibilityPercentage],
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
    "Expand NHCE eligibility by removing restrictive criteria.",
    "Boost NHCE participation with education and incentives.",
    "Balance employer contributions between HCEs and NHCEs.",
    "Update plan rules to meet IRS nondiscrimination standards.",
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
      "Potential IRS penalties or plan disqualification.",
      "Potential disqualification of the Health FSA plan.",
      "Loss of tax-free DCAP benefits for employees.",
    ];

    consequences.forEach((item) => {
      pdf.text(`• ${item}`, 15, bulletY2);
      bulletY2 += lineHeight;
    });
  }

  // Save the PDF
  pdf.save("DCAP_Eligibility_Test_Results.pdf");

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
        📂 Upload DCAP Eligibility File
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
          isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-gray-50"
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
        className="mt-4 w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
      >
        Choose File
      </button>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        className={`w-full mt-4 px-4 py-2 text-white rounded-md ${
          !file ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
        }`}
        disabled={!file || loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* Display Results */}
      {result && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h3 className="font-bold text-xl text-gray-700 flex items-center">
            DCAP Eligibility Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {result["Total Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligible Employees:</strong>{" "}
              <span className="font-semibold text-green-600">
                {result["Eligible Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">DCAP Eligibility Percentage (%):</strong>{" "}
              <span className="font-semibold text-blue-600">
                {result["DCAP Eligibility Percentage (%)"] !== undefined
                  ? result["DCAP Eligibility Percentage (%)"] + "%"
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
  <strong className="text-gray-700">Test Result:</strong>{" "}
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

            {/* If failed, show corrective actions + consequences in the UI as well */}
            {result["DCAP Eligibility Test Result"] === "Failed" && (
              <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Expand Eligibility for NHCEs: Remove restrictive criteria that exclude NHCEs from participating in DCAP.</li>
                  <br />
                  <li>Increase NHCE Participation: Improve education and awareness, offer enrollment incentives, and simplify the sign-up process.</li>
                  <br />
                  <li>Adjust Employer Contributions: Ensure employer contributions are evenly distributed among HCEs and NHCEs.</li>
                  <br />
                  <li>Amend the Plan Document: Modify eligibility and contribution rules to align with IRS nondiscrimination requirements.</li>
                </ul>
              </div>

            {/* Display consequences if the test fails */}
              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ Potential IRS penalties or plan disqualification.</li>
                  <br />
                  <li>❌ Potential disqualification of the Health FSA plan.</li>
                  <br />
                  <li>❌ Loss of tax-free DCAP benefits for employees.</li>
                 </ul>
                </div>
              </>
            )}
          </div>

          {/* Export & Download Buttons */}
          <div className="flex flex-col gap-2 mt-4">
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
        </div>
      )}
    </div>
  );
};
            

export default DCAPEligibilityTest;
