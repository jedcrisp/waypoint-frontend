import { useState, useCallback } from "react";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Ensure this utility is correctly implemented and exported
import { useDropzone } from "react-dropzone";
import axios from "axios";
import CsvTemplateDownloader from "../components/CsvTemplateDownloader"; // Adjust the path as needed
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";

const HealthFSABenefitsTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan Year dropdown state

  const API_URL = import.meta.env.VITE_BACKEND_URL; // Ensure this is correct


  // Formatting helpers
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "N/A";
    return `$${parseFloat(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercentage = (value) => {
    if (!value || isNaN(value)) return "N/A";
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Handle file selection via drag & drop
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv, .xlsx",
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }
    // Validate file type
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
    formData.append("selected_tests", "health_fsa_benefits");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/health_fsa_benefits`);
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
      const response = await axios.post(`${API_URL}/upload-csv/health_fsa_benefits`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["health_fsa_benefits"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger upload on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // CSV Template Download
  const downloadCSVTemplate = () => {
    const csvTemplate = [
  ["Last Name", "First Name", "Employee ID", "HCI", "Health FSA Benefits", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"],
  ["Last", "First", "001", "No", 1500, "1985-01-12", "2012-03-01", "Active", "No", "2013-01-01", "No", "No"],
  ["Last", "First", "002", "Yes", 2500, "1978-05-22", "2008-06-15", "Active", "No", "2009-01-01", "No", "No"],
  ["Last", "First", "003", "No", 1000, "1992-07-10", "2020-04-20", "Active", "No", "2021-01-01", "No", "No"],
  ["Last", "First", "004", "Yes", 3000, "1980-11-30", "2005-11-01", "Active", "No", "2006-01-01", "No", "No"],
  ["Last", "First", "005", "No", 0, "2000-09-05", "2022-05-10", "Terminated", "No", "2023-01-01", "No", "No"],
  ["Last", "First", "006", "Yes", 2800, "1983-03-18", "2010-01-01", "Active", "No", "2011-01-01", "No", "No"],
  ["Last", "First", "007", "No", 1200, "2001-12-01", "2023-06-01", "Active", "No", "2023-07-01", "No", "Yes"],
  ["Last", "First", "008", "Yes", 2700, "1975-04-14", "2000-08-10", "Active", "No", "2001-01-01", "No", "No"],
  ["Last", "First", "009", "No", 900, "1997-10-27", "2017-07-01", "Leave", "No", "2018-01-01", "No", "No"],
  ["Last", "First", "010", "No", 1100, "2002-02-15", "2022-12-15", "Active", "No", "2023-01-01", "No", "No"]
]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Health_FSA_Benefits_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Results Download (with corrective actions & consequences if failed)
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      ["Total Participants", result["Total Participants"] ?? "N/A"],
      ["HCI Average Benefits (USD)", result["HCI Average Benefits (USD)"] ?? "N/A"],
      ["Non-HCI Average Benefits (USD)", result["Non-HCI Average Benefits (USD)"] ?? "N/A"],
      ["Benefit Ratio (%)", result["Benefit Ratio (%)"] ?? "N/A"],
      ["Test Result", result["Test Result"] ?? "N/A"],
    ];

    if (result["Test Result"]?.toLowerCase() === "failed") {
      const correctiveActions = [
        "Adjust employer contributions to ensure compliance with IRS limits.",
        "Increase NHCE participation through targeted incentives.",
        "Reassess benefit allocation to achieve balanced ratios.",
      ];
      const consequences = [
        "HCI benefits may become taxable.",
        "IRS penalties and fines could apply.",
        "Risk of plan disqualification.",
      ];
      csvRows.push([], ["Corrective Actions"], ...correctiveActions.map(action => ["", action]));
      csvRows.push([], ["Consequences"], ...consequences.map(item => ["", item]));
    }

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Health_FSA_Benefits_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

 // =========================
  // 6. Export to PDF with Firebase Save
  // =========================
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    let pdfBlob;
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Health FSA 55% Average Benefits Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        "Test Criterion: HCE average benefits must not exceed 125% of NHCE average benefits",
        105,
        38,
        { align: "center", maxWidth: 180 }
      );

      // Table with Results
      pdf.autoTable({
        startY: 44,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Health FSA Benefits (Avg)", result["Total Health FSA Benefits (Avg)"] ?? "N/A"],
          ["NHCE Average Benefit", result["NHCE Average Benefit"] ?? "N/A"],
          ["HCE Average Benefit", result["HCE Average Benefit"] ?? "N/A"],
          ["Average Benefits Ratio (%)", result["Average Benefits Ratio (%)"] ?? "N/A"],
          ["Test Result", result["Test Result"] ?? "N/A"],
        ],
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
        },
        styles: {
          fontSize: 12,
          font: "helvetica",
        },
        margin: { left: 10, right: 10 },
      });

      if (result["Test Result"]?.toLowerCase() === "failed") {
        const y = pdf.lastAutoTable.finalY + 10;
        pdf.setFillColor(255, 230, 230);
        pdf.setDrawColor(255, 0, 0);
        pdf.rect(10, y, 190, 30, "FD");
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Corrective Actions:", 15, y + 7);
        const actions = [
          "• Review and adjust contributions to ensure NHCE average benefit is at least 55% of HCE average benefit",
          "• Increase NHCE participation or modify formulas accordingly",
          "• Reevaluate plan design to improve IRS compliance",
        ];
        actions.forEach((action, i) => pdf.text(action, 15, y + 14 + i * 5));

        const y2 = y + 40;
        pdf.setFillColor(255, 255, 204);
        pdf.setDrawColor(255, 204, 0);
        pdf.rect(10, y2, 190, 30, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(204, 153, 0);
        pdf.text("Consequences:", 15, y2 + 10);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        const consequences = [
          "• Potential reclassification of benefits as taxable",
          "• Increased IRS scrutiny and potential penalties",
          "• Risk of plan disqualification",
        ];
        consequences.forEach((item, i) => pdf.text(item, 15, y2 + 18 + i * 5));
      }

      // Generate PDF blob and save locally
      pdfBlob = pdf.output("blob");
      pdf.save("Health_FSA_55_Average_Benefits_Results.pdf");
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }
    try {
      // Upload the PDF blob to Firebase Storage using your helper utility
      await savePdfResultToFirebase({
        fileName: "Health_FSA_Benefits_Test",
        pdfBlob,
        additionalData: {
          planYear,
          testResult: result["Test Result"] ?? "Unknown",
        },
      });
    } catch (error) {
      setError(`❌ Error saving PDF to Firebase: ${error.message}`);
    }
  };
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload Health FSA Benefits File
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

      {/* Dedicated "Choose File" Button */}
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
          !file ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-400"
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
          <h3 className="font-bold text-xl text-gray-700">
            Health FSA Benefits Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {planYear || "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Total Participants:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Participants"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg">
  <strong className="text-gray-700">HCI Average Benefits:</strong>{" "}
  <span className="font-semibold text-black-600">
    {formatCurrency(result?.["HCI Average Benefits (USD)"])}
  </span>
</p>

<p className="text-lg mt-2">
  <strong className="text-gray-700">Non-HCI Average Benefits:</strong>{" "}
  <span className="font-semibold text-black-600">
    {formatCurrency(result?.["Non-HCI Average Benefits (USD)"])}
  </span>
</p>

<p className="text-lg mt-2">
  <strong className="text-gray-700">Benefit Ratio:</strong>{" "}
  <span className="font-semibold text-black-600">
    {formatPercentage(result?.["Benefit Ratio (%)"])}
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

          {result?.["Test Result"] === "Failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>
                    Adjust employer contributions to ensure compliance with IRS limits.
                  </li>
                  <br />
                  <li>
                    Increase NHCE participation through education and incentives.
                  </li>
                  <br />
                  <li>
                    Amend plan documents to balance contributions and benefits.
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ HCI benefits may become taxable.</li>
                  <br />
                  <li>❌ Increased IRS scrutiny and potential penalties.</li>
                  <br />
                  <li>❌ Risk of plan disqualification.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthFSABenefitsTest;
