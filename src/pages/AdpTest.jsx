import React, { useState, useCallback } from "react";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Firebase PDF saver
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ADPTest = () => {
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
      
      // Get Firebase token
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      console.log("Firebase Token:", token);

      // POST request to your backend
      const response = await axios.post(`${API_URL}/upload-csv/adp`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ Backend response:", response.data);
      const safeHarborResults = response.data?.["Test Results"]?.["adp"];
      if (!safeHarborResults) {
        setError("❌ No ADP test results found in response.");
      } else {
        setResult(safeHarborResults);
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
  ["Last Name", "First Name", "Employee ID", "Eligible for Cafeteria Plan", "Employer Contribution", "Cafeteria Plan Benefits", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test", "Union Employee", "Part-Time / Seasonal", "Plan Entry Date", "Compensation", "Employee Deferral"],
  ["Last", "First", "E001", "Yes", "1500", "3000", "Yes", "1980-04-12", "2015-06-01", "Active", "No", "No", "No", "2015-07-01", "95000", "12000"],
  ["Last", "First", "E002", "Yes", "1200", "2800", "No", "1985-11-03", "2019-01-15", "Active", "No", "No", "No", "2019-02-01", "72000", "8000"],
  ["Last", "First", "E003", "Yes", "1000", "2600", "No", "1990-01-01", "2021-05-01", "Active", "No", "No", "Yes", "2021-05-15", "65000", "5000"],
  ["Last", "First", "E004", "No", "0", "0", "No", "1992-07-08", "2022-01-10", "Active", "No", "Yes", "No", "2022-02-01", "58000", "0"],
  ["Last", "First", "E005", "Yes", "1800", "3200", "Yes", "1979-02-18", "2010-09-20", "Active", "No", "No", "No", "2010-10-01", "102000", "15000"],
  ["Last", "First", "E006", "Yes", "1100", "2500", "No", "1988-10-23", "2016-03-14", "Active", "No", "No", "No", "2016-04-01", "73000", "7000"],
  ["Last", "First", "E007", "No", "0", "0", "No", "2001-03-05", "2023-06-01", "Active", "No", "No", "Yes", "2023-06-15", "32000", "0"],
  ["Last", "First", "E008", "Yes", "1300", "2700", "Yes", "1982-05-15", "2011-12-01", "Active", "No", "No", "No", "2012-01-01", "88000", "11000"],
  ["Last", "First", "E009", "Yes", "1400", "2900", "No", "1995-08-09", "2018-07-01", "Active", "No", "Yes", "No", "2018-07-15", "69000", "6500"],
  ["Last", "First", "E010", "Yes", "1600", "3100", "Yes", "1983-12-30", "2009-05-15", "Active", "No", "No", "No", "2009-06-01", "99000", "14000"]
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
    const totalParticipants = result["Total Participants"] ?? "N/A"; 
    const hceAdp = result["HCE ADP"] !== undefined ? formatPercentage(result["HCE ADP"]) : "N/A";
    const nhceAdp = result["NHCE ADP"] !== undefined ? formatPercentage(result["NHCE ADP"]) : "N/A"
    const testRes = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Total Participants", totalParticipants],
      ["HCE ADP", hceAdp],
      ["NHCE ADP", nhceAdp],
      ["Test Result", testRes],
    ];

    if (String(testRes).toLowerCase() === "failed") {
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
    link.setAttribute("download", "ADP_Test_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 6. Export Results to PDF with Firebase Storage Integration ---
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    let pdfBlob;
    try {
      // Retrieve metrics from result and format them
      const totalEmployees = result["Total Employees"] ?? "N/A";
      const totalParticipants = result["Total Participants"] ?? "N/A"; 
      const hceAdp = result["HCE ADP"] !== undefined ? formatPercentage(result["HCE ADP"]) : "N/A";
      const nhceAdp = result["NHCE ADP"] !== undefined ? formatPercentage(result["NHCE ADP"]) : "N/A"
      const testRes = result["Test Result"] ?? "N/A";
      const failed = testRes.toLowerCase() === "failed";

      // Generate the PDF
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ratio Percentage Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear || "N/A"}`, 105, 25, { align: "center" });
      const generatedTimestamp = new Date().toLocaleString();
      pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

      // Basic Results Table
      pdf.autoTable({
        startY: 40,
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", totalEmployees],
          ["Total Participants", totalParticipants],
          ["HCE ADP", hceAdp],
          ["NHCE ADP", nhceAdp ],
          ["Test Result", testRes],
        ],
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 12, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });

      // If test failed, add corrective actions & consequences
      if (failed) {
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
        pdf.save("ADP_Test_Results.pdf");
      } catch (error) {
        setError(`❌ Error exporting PDF: ${error.message}`);
        return;
      }
      try {
        await savePdfResultToFirebase({
          fileName: "ADP_Test_Results.pdf",
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

  // --- 8. Render ---
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload ADP File
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
          <h3 className="font-bold text-xl text-gray-700">ADP Test Results</h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong>Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
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
              <strong>HCE ADP:</strong>{" "}
              {formatPercentage(result["HCE ADP (%)"])}
            </p>
            <p className="text-lg mt-2">
              <strong>NHCE ADP:</strong>{" "}
              {formatPercentage(result["NHCE (%)"])}
            </p>
            <p className="text-lg mt-2">
              <strong>Test Result:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-md font-bold ${
                  result["Test Result"] === "Passed" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}
              >
                {result["Test Result"] || "N/A"}
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
                <h4 className="font-bold text-black">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black">
                  <li>
                    Increase NHCE participation to ensure at least 70% of the HCE rate.
                  </li>
                  <br />
                  <li>
                    Adjust eligibility criteria to include more NHCEs.
                  </li>
                  <br />
                  <li>
                    Modify plan structure or incentives to encourage NHCE participation.
                  </li>
                  <br />
                  <li>
                    Review plan design to ensure compliance with IRC § 410(b).
                  </li>
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
        </div>
      )}
    </div>
  );
};

export default ADPTest;
