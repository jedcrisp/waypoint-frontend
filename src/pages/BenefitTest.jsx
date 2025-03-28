import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";

const BenefitTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year dropdown
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Adjust your backend URL as needed
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
    accept: ".csv",
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // =========================
  // 2. Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    // Example CSV template for this "Benefit" test
    const csvTemplate = [
  ["Last Name", "First Name", "Employee ID", "Cafeteria Plan Benefits", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date", "Part-Time / Seasonal", "Union Employee"],
  ["Last", "First", "E001", "1500", "Yes", "1980-04-12", "2015-06-01", "Active", "No", "2016-01-01", "No", "No"],
  ["Last", "First", "E002", "1200", "No", "1985-11-03", "2019-01-15", "Active", "No", "2020-02-10", "No", "No"],
  ["Last", "First", "E003", "1800", "Yes", "1975-07-22", "2010-03-01", "Active", "No", "2011-01-01", "No", "Yes"],
  ["Last", "First", "E004", "1600", "No", "1990-09-10", "2018-06-11", "Active", "No", "2019-01-01", "Yes", "No"],
  ["Last", "First", "E005", "1400", "Yes", "1978-03-17", "2009-04-10", "Active", "No", "2010-01-01", "No", "No"],
  ["Last", "First", "E006", "0", "No", "1995-01-01", "2023-02-01", "Leave", "Yes", "2023-02-01", "Yes", "No"],
  ["Last", "First", "E007", "1300", "No", "1992-06-25", "2021-09-15", "Active", "No", "2021-10-01", "No", "No"],
  ["Last", "First", "E008", "1700", "Yes", "1988-05-30", "2016-08-20", "Active", "No", "2017-01-01", "No", "Yes"],
  ["Last", "First", "E009", "0", "No", "2000-12-11", "2023-06-01", "Terminated", "No", "2023-06-01", "Yes", "No"],
  ["Last", "First", "E010", "1550", "No", "1991-11-05", "2020-05-10", "Active", "No", "2020-06-01", "No", "No"]
]

      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Benefit_Test_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 3. Upload File to Backend
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
    const validFileTypes = ["csv"];
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!validFileTypes.includes(fileType)) {
      setError("❌ Invalid file type. Please upload a CSV file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("selected_tests", "benefit");
    formData.append("plan_year", planYear); // Include the selected plan year

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/benefit`);
      console.log("📂 File Selected:", file.name);

      // 1. Get Firebase token
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      // 2. Send POST request
      const response = await axios.post(`${API_URL}/upload-csv/benefit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ API Response:", response.data);
      setResult(response.data["Test Results"]["benefit"]);
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 4. Export to PDF
  // =========================
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    const plan = planYear || "N/A";
    const totalEligibleEmployees = result["Total Eligible Employees"] ?? "N/A";
    const hceCount = result["HCE Count"] ?? "N/A";
    const hcePct = formatPercentage(result["HCE Percentage (%)"]);
    const testResult = result["Test Result"] || "N/A";
    const failed = testResult.toLowerCase() === "failed";

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60); // Gray text
    pdf.text(
      "Test Criterion: ≤ 25% of eligible participants may be HCEs",
      105,
      38,
      { align: "center", maxWidth: 180 }
    );


    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Cafeteria Benefit Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

    // Table
    pdf.autoTable({
      startY: 40,
      head: [["Metric", "Value"]],
      body: [
        ["Total Eligible Employees", totalEligibleEmployees],
        ["HCE Count", hceCount],
        ["HCE Percentage", hcePct],
        ["Test Result", testResult],
      ],
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 12,
      font: "helvetica",
      lineColor: [150, 150, 150],  // Medium gray
      lineWidth: 0.2         // Thicker grid lines
    },
    margin: { left: 10, right: 10 },
  });
  
    // Corrective actions & consequences (only if failed)
  if (failed) {
    const correctiveActions = [
        "Refund Excess Contributions to Highly Compensated Employees (HCEs)",
        "Make Additional Contributions to Non-HCEs",
        "Recharacterize Excess Contributions",
    ];

    const consequences = [
        "Loss of Tax-Exempt Status for Key Employees",
        "IRS Scrutiny and Potential Penalties",
        "Plan Disqualification Risks",
        "Employee Discontent & Reduced Participation",
        "Reputational and Legal Risks",
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

    // Footer
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

    pdf.save("Cafeteria_Benefit_Test_Results.pdf");
  };

  // =========================
  // 5. Download Results as CSV
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    const totalEligibleEmployees = result["Total ELigible Employees"] ?? "N/A";
    const hceCount = result["HCE Count"] ?? "N/A";
    const hcePct = result["HCE Percentage (%)"] !== undefined
      ? result["HCE Percentage (%)"] + "%"
      : "N/A";
    const testResult = result["Test Result"] ?? "N/A";
    const failed = testResult.toLowerCase() === "failed";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      ["Total Eligible Employees", totalEligibleEmployees],
      ["HCE Count", hceCount],
      ["HCE Percentage (%)", hcePct],
      ["Test Result", testRes],
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Benefit_Test_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        📂 Upload Cafeteria Benefit File
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

      {/* Choose File (Blue) */}
      <button
        type="button"
        onClick={open}
        className="mt-4 w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
      >
        Choose File
      </button>

      {/* Upload (Green if valid, else Gray) */}
      <button
        onClick={handleUpload}
        className={`w-full mt-4 px-4 py-2 text-white rounded-md ${
          !file || !planYear
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-400"
        }`}
        disabled={!file || !planYear || loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* Display Results */}
      {result && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h3 className="font-bold text-xl text-gray-700">Cafeteria Benefit Test Results</h3>
          <div className="mt-4">
            <p className="text-lg mt-2">
            <strong className="text-gray-700">Plan Year:</strong>{" "}
            <span className="font-semibold text-blue-600">
              {planYear || "N/A"}
            </span>
          </p>
          <p className="text-lg mt-2">
          <strong className="text-gray-700">Total Employees:</strong>{" "}
            <span className="font-semibold text-black-600">
            {result?.["Total Eligible Employees"] ?? "N/A"}
          </span>
          </p>
          <p className="text-lg mt-2">
          <strong className="text-gray-700">HCE Count:</strong>{" "}
            <span className="font-semibold text-black-600">
            {result?.["HCE Count"] ?? "N/A"}
          </span>
          </p>
          <p className="text-lg mt-2">
          <strong className="text-gray-700">HCE Percentage:</strong>{" "}
          <span className="font-semibold text-black-600">
            {formatPercentage(result?.["HCE Percentage (%)"]) || "N/A"}
          </span>
          </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Test Result:</strong>{" "}
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

          {/* If test fails, show corrective actions & consequences */}
          {result["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Refund Excess Contributions to Highly Compensated Employees (HCEs).</li>
                  <br />
                  <li>Make Additional Contributions to Non-HCEs.</li>
                  <br />
                  <li>Recharacterize Excess Contributions.</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Loss of Tax-Exempt Status for Key Employees</li>
                  <br />
                  <li>IRS Scrutiny and Potential Penalties</li>
                  <br />
                  <li>Plan Disqualification Risks</li>
                  <br />
                  <li>Employee Discontent & Reduced Participation</li>
                  <br />
                  <li>Reputational and Legal Risks</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BenefitTest;
