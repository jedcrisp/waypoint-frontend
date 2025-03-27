import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const HRAEligibilityTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Formatting helpers
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
    formData.append("selected_tests", "hra_eligibility");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/hra_eligibility`);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      console.log("Firebase Token:", token);
      const response = await axios.post(
        `${API_URL}/upload-csv/hra_eligibility`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["hra_eligibility"] || {});
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
  ["Last Name", "First Name", "Employee ID", "HCI", "Eligible for HRA", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"],
  ["Last", "First", "001", "Yes", "Yes", "1978-01-01", "2010-06-01", "Active", "No", "2020-01-01", "No", "No"],
  ["Last", "First", "002", "No", "No", "1980-02-02", "2011-07-01", "Active", "No", "2021-02-01", "No", "No"],
  ["Last", "First", "003", "Yes", "Yes", "1975-03-03", "2009-05-15", "Active", "No", "2019-03-01", "No", "No"],
  ["Last", "First", "004", "No", "No", "1982-04-04", "2012-08-01", "Active", "No", "2022-04-01", "No", "No"],
  ["Last", "First", "005", "Yes", "Yes", "1978-05-05", "2010-10-01", "Active", "No", "2020-05-01", "No", "No"],
  ["Last", "First", "006", "Yes", "No", "1980-06-06", "2011-11-01", "Active", "No", "2021-06-01", "No", "No"],
  ["Last", "First", "007", "No", "Yes", "1975-07-07", "2009-12-01", "Active", "No", "2019-07-01", "No", "No"],
  ["Last", "First", "008", "Yes", "Yes", "1982-08-08", "2012-01-15", "Active", "No", "2022-08-01", "No", "No"],
  ["Last", "First", "009", "No", "No", "1978-09-09", "2010-03-01", "Active", "No", "2020-09-01", "No", "No"],
  ["Last", "First", "010", "Yes", "Yes", "1980-10-10", "2011-04-01", "Active", "No", "2021-10-01", "No", "No"]
];
    const csvTemplate = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "HRA_Eligibility_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 4. Export Results to PDF ---
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    const totalEmployees = result["Total Employees"] ?? "N/A";
    const hciEligibility = result["HCI Eligibility (%)"] !== undefined
      ? formatPercentage(result["HCI Eligibility (%)"])
      : "N/A";
    const nonHCIEligibility = result["Non-HCI Eligibility (%)"] !== undefined
      ? formatPercentage(result["Non-HCI Eligibility (%)"])
      : "N/A";
    const eligibilityRatio = result["Eligibility Ratio (%)"] !== undefined
      ? formatPercentage(result["Eligibility Ratio (%)"])
      : "N/A";
    const testRes = result["Test Result"] ?? "N/A";
    const failed = testRes.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("HRA Eligibility Test Results", 105, 15, { align: "center" });
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
        ["HCI Eligibility (%)", hciEligibility],
        ["Non-HCI Eligibility (%)", nonHCIEligibility],
        ["Eligibility Ratio (%)", eligibilityRatio],
        ["Test Result", testRes],
      ],
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      styles: { fontSize: 12, font: "helvetica" },
      margin: { left: 10, right: 10 },
    });

    if (failed) {
      const y = pdf.lastAutoTable.finalY + 10;
      pdf.setFillColor(255, 230, 230);
      pdf.setDrawColor(255, 0, 0);
      pdf.rect(10, y, 190, 35, "FD");
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Corrective Actions:", 15, y + 8);
      const actions = [
        "• Expand HRA eligibility for NHCEs",
        "• Eliminate discriminatory requirements",
        "• Encourage NHCE enrollment through education and incentives",
        "• Amend plan document to comply with IRS guidelines",
      ];
      let bulletY = y + 14;
      actions.forEach((action) => {
        pdf.text(action, 15, bulletY);
        bulletY += 5;
      });

      const y2 = y + 45;
      pdf.setFillColor(255, 255, 204);
      pdf.setDrawColor(255, 204, 0);
      pdf.rect(10, y2, 190, 40, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(204, 153, 0);
      pdf.text("Consequences:", 15, y2 + 10);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      const consequences = [
        "• Plan may lose tax-qualified status",
        "• IRS penalties and plan disqualification risk",
        "• Additional corrective contributions may be required",
        "• Increased IRS audit risk due to compliance failure",
      ];
      let bulletY2 = y2 + 18;
      consequences.forEach((item) => {
        pdf.text(item, 15, bulletY2);
        bulletY2 += 5;
      });
    }

    pdf.save("HRA_Eligibility_Results.pdf");
  };

  // --- 5. Download Results as CSV ---
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    const totalEmployees = result["Total Employees"] ?? "N/A";
    const eligibleEmployees = result["Eligible Employees"] ?? "N/A";
    const eligibilityPct = result["Eligibility Percentage (%)"] !== undefined
      ? formatPercentage(result["Eligibility Percentage (%)"])
      : "N/A";
    const testRes = result["Test Result"] ?? "N/A";
    const failed = testRes.toLowerCase() === "failed";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      ["Total Employees", totalEmployees],
      ["Eligible Employees", eligibleEmployees],
      ["Eligibility Percentage (%)", eligibilityPct],
      ["Test Result", testRes],
    ];

    if (failed) {
      const correctiveActions = [
        "Expand HRA eligibility for NHCEs",
        "Eliminate discriminatory requirements",
        "Encourage NHCE enrollment through education and incentives",
        "Amend plan document to comply with IRS guidelines",
      ];
      const consequences = [
        "HCEs’ HRA benefits may become taxable",
        "IRS penalties and plan disqualification risk",
        "NHCEs may lose access to tax-free HRA benefits",
      ];
      csvRows.push([], ["Corrective Actions"], ...correctiveActions.map(a => ["", a]));
      csvRows.push([], ["Consequences"], ...consequences.map(c => ["", c]));
    }

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "HRA_Eligibility_Results.csv");
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
        📂 Upload HRA Eligibility File
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
          <h3 className="font-bold text-xl text-gray-700">HRA Eligibility Test Results</h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">HCI Eligibility:</strong>{" "}
              {formatPercentage(result["HCI Eligibility (%)"])}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Non-HCI Eligibility:</strong>{" "}
              {formatPercentage(result["Non-HCI Eligibility (%)"])}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Key Employee Benefit:</strong>{" "}
              {formatPercentage(result["Eligibility Ratio (%)"])}
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
          {result["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Review employee eligibility criteria.</li>
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
                  <li>❌ Loss of tax-exempt status for key employees.</li>
                  <br />
                  <li>❌ IRS compliance violations and penalties.</li>
                  <br />
                  <li>❌ Plan disqualification risks.</li>
                  <br />
                  <li>❌ Employee dissatisfaction and legal risks.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HRAEligibilityTest;
