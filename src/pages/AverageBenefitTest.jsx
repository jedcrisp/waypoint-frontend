import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Integrated from DCAP contributions

const AverageBenefitTest = () => {
  // ----- State -----
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year selection
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // ---------- Formatting Helpers ----------
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(Number(amount)))
      return "N/A";
    return `$${Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(Number(value)))
      return "N/A";
    return `${Number(value).toFixed(2)}%`;
  };

  // ----- 1. Drag & Drop Logic -----
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

  // ----- 2. CSV Template Download -----
  const downloadCSVTemplate = () => {
    const csvTemplate = [
  ["Last Name", "First Name", "Employee ID", "Total Benefits", "DOB", "DOH", "Employment Status", "Excluded from Test", "HCE", "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"],
  ["Last", "First", "001", "4500", "1980-04-12", "2010-06-01", "Active", "No", "Yes", "2011-01-01", "No", "No"],
  ["Last", "First", "002", "3700",  "1985-11-03", "2015-08-15", "Active", "No", "No", "2016-01-01", "No", "No"],
  ["Last", "First", "003", "5200",  "1978-01-22", "2008-02-18", "Active", "No", "Yes", "2009-01-01", "No", "No"],
  ["Last", "First", "004", "3300",  "1990-09-14", "2020-03-12", "Active", "No", "No", "2020-04-01", "No", "Yes"],
  ["Last", "First", "005", "4700",  "1992-07-29", "2016-09-05", "Active", "No", "No", "2016-10-01", "No", "No"],
  ["Last", "First", "006", "6000",  "1975-05-19", "2005-01-10", "Active", "No", "Yes", "2005-02-01", "Yes", "No"],
  ["Last", "First", "007", "3900",  "1994-02-17", "2021-06-01", "Active", "No", "No", "2021-07-01", "No", "Yes"],
  ["Last", "First", "008", "5300",  "1982-12-11", "2011-10-08", "Active", "No", "Yes", "2012-01-01", "No", "No"],
  ["Last", "First", "009", "3600",  "1989-08-05", "2018-11-20", "Active", "No", "No", "2019-01-01", "No", "No"],
  ["Last", "First", "010", "4900",  "1987-06-06", "2012-04-10", "Active", "No", "Yes", "2012-05-01", "No", "No"]
]

    const blob = new Blob([csvTemplate.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Average Benefit Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 3. Upload File to Backend -----
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }

    // Validate file type
    const validFileTypes = ["csv"];
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!validFileTypes.includes(fileType)) {
      setError("❌ Invalid file type. Please upload a CSV file.");
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
    formData.append("selected_tests", "average_benefit");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/average_benefit`);
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
      const response = await axios.post(
        `${API_URL}/upload-csv/average_benefit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["average_benefit"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError(
        err.response?.data?.error ||
          "❌ Failed to upload file. Please check the format and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ----- 4. Download Results as CSV -----
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const totalBenefits = result["Total Benefits"] ?? "N/A";
    const averageBenefitRatio = result["Average Benefit Ratio"] ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Total Participants", totalParticipants],
      ["Total Benefits", totalBenefits],
      ["Average Benefit Ratio", averageBenefitRatio],
      ["Test Result", testResult],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Average_Benefit_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 5. Export to PDF (Integrated with DCAP Contributions functions) -----
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    let pdfBlob;
    try {
      const plan = planYear || "N/A";
      const totalBenefits = formatCurrency(result["Total Benefits"]);
      const totalEmployees = result["Total Employees"] || "N/A";
      const totalParticipants = result["Total Participants"] || "N/A";
      const averageBenefitRatio = formatPercentage(result["Average Benefit Ratio"]);
      const testResult = result["Test Result"] || "N/A";
      const failed = testResult.toLowerCase() === "failed";

      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Average Benefit Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${plan}`, 105, 25, { align: "center" });
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        "Test Criterion: IRC §410(b)(2): The Average Benefit Test is met if the average benefit percentage of Non-Highly Compensated Employees (NHCEs) is at least 70% of that of Highly Compensated Employees (HCEs), ensuring the plan does not disproportionately favor HCEs.",
        105,
        38,
        { align: "center", maxWidth: 180 }
      );

      // Section 1: Basic Results Table
      pdf.autoTable({
        startY: 52,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", totalEmployees],
          ["Total Participants", totalParticipants],
          ["Total Benefits", totalBenefits],
          ["Average Benefit Ratio", averageBenefitRatio],
          ["Test Result", testResult],
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

      if (failed) {
        pdf.autoTable({
          startY: pdf.lastAutoTable.finalY + 10,
          theme: "grid",
          head: [["Corrective Actions"]],
          body: [
            ["Review benefit allocation formulas."],
            ["Adjust contribution amounts to boost NHCE benefits."],
            ["Consider additional employer contributions."],
          ],
          headStyles: { fillColor: [255, 0, 0], textColor: [255, 255, 255] },
          styles: { fontSize: 11, font: "helvetica" },
          margin: { left: 10, right: 10 },
        });

        pdf.autoTable({
          startY: pdf.lastAutoTable.finalY + 10,
          theme: "grid",
          head: [["Consequences"]],
          body: [
            ["Potential reclassification of benefits as taxable."],
            ["Increased IRS scrutiny and possible penalties."],
            ["Need for corrective contributions."],
          ],
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

      pdfBlob = pdf.output("blob");
      pdf.save("Average Benefit Results.pdf");
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }

    try {
      await savePdfResultToFirebase({
        fileName: "Average Benefit",
        pdfBlob,
        additionalData: {
          planYear,
          testResult: result["Test Result"] || "Unknown",
        },
      });
    } catch (error) {
      setError(`❌ Error saving PDF to Firebase: ${error.message}`);
    }
  };

  // ----- RENDER -----
  return (
    <div
      className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg border border-gray-300"
      onKeyDown={(e) => {
        if (e.key === "Enter" && file && planYear && !loading) {
          e.preventDefault();
          e.stopPropagation();
          handleUpload();
        }
      }}
      tabIndex="0"
    >
      <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">
        📂 Upload Average Benefit Test File
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
            Drag & drop a <strong>CSV file</strong> here.
          </p>
        )}
      </div>

      {/* Download CSV Template Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={downloadCSVTemplate}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Download CSV Template
        </button>
      </div>

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
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* Display Results */}
      {result && (
        <>
          <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
            <h3 className="font-bold text-xl text-gray-700">
              Average Benefit Test Results
            </h3>
            <div className="mt-4">
              <p className="text-lg">
                <strong>Plan Year:</strong>{" "}
                <span className="font-semibold text-blue-600">
                  {planYear || "N/A"}
                </span>
              </p>
              <p className="text-lg">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              {result["Total Employees"] ?? "N/A"}
            </p>
            <p className="text-lg">
              <strong className="text-gray-700">Total Participants:</strong>{" "}
              {result["Total Participants"] ?? "N/A"}
            </p>
              <p className="text-lg mt-2">
                <strong>Total Benefits:</strong>{" "}
                <span className="font-semibold text-gray-800">
                  {formatCurrency(result?.["Total Benefits"])}
                </span>
              </p>
              <p className="text-lg mt-2">
                <strong>Average Benefit Ratio:</strong>{" "}
                <span className="font-semibold text-gray-800">
                  {formatPercentage(result?.["Average Benefit Ratio"])}
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
                  {result?.["Test Result"] || "N/A"}
                </span>
              </p>
            </div>
          </div>

          {/* Export & Download Buttons (Only appear after test is run) */}
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
          {result?.["Test Result"]?.toLowerCase() === "failed" && (
            <div>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-gray-800">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-gray-800">
                  <li>Review benefit allocation formulas.</li>
                  <br />
                  <li>Adjust contribution amounts to boost NHCE benefits.</li>
                  <br />
                  <li>Consider additional employer contributions.</li>
                </ul>
              </div>
              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-gray-800">Consequences:</h4>
                <ul className="list-disc list-inside text-gray-800">
                  <li>Benefits may be reclassified as taxable.</li>
                  <br />
                  <li>Increased IRS scrutiny and potential penalties.</li>
                  <br />
                  <li>Additional corrective contributions may be required.</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AverageBenefitTest;
