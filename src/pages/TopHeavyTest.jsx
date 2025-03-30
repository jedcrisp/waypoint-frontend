import React, { useState, useCallback } from "react";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Firebase PDF saver
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const TopHeavyTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // ----- Formatting Helpers -----
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

  // ----- 2. Upload File to Backend -----
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
    formData.append("selected_tests", "top_heavy");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/top_heavy`);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      console.log("Firebase Token:", token);

      const response = await axios.post(`${API_URL}/upload-csv/top_heavy`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["top_heavy"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.error || "❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ----- 3. Handle Enter Key -----
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // ----- 4. Download CSV Template -----
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      ["Last Name", "First Name", "Employee ID", "Plan Assets", "Key Employee", "Ownership %", "Family Member", "DOB", "DOH", "Excluded from Test", "Employment Status"],
      ["Last", "First", "001", 25000, "Yes", "5", "No", "1980-01-01", "2010-01-15", "No", "Active"],
      ["Last", "First", "002", 18000, "No", "0", "No", "1985-03-22", "2012-05-30", "No", "Active"],
      ["Last", "First", "003", 30000, "Yes", "10", "Yes", "1975-07-12", "2005-08-01", "No", "Active"],
      ["Last", "First", "004", 0, "No", "0", "No", "1992-10-19", "2021-04-05", "No", "Active"],
      ["Last", "First", "005", 40000, "Yes", "20", "No", "1983-06-14", "2008-07-20", "No", "Active"],
      ["Last", "First", "006", 0, "No", "0", "No", "1998-12-05", "2022-09-01", "Yes", "Terminated"],
      ["Last", "First", "007", 15000, "No", "0", "No", "1990-09-09", "2018-03-15", "No", "Leave"],
      ["Last", "First", "008", 22000, "Yes", "15", "Yes", "1978-04-25", "2003-02-10", "No", "Active"],
      ["Last", "First", "009", 0, "No", "0", "No", "1995-11-11", "2023-01-05", "No", "Active"],
      ["Last", "First", "010", 27000, "Yes", "8", "No", "1982-02-02", "2011-06-30", "No", "Active"],
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Top_Heavy_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 5. Download Results as CSV -----
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalAssets = result["Total Plan Assets"] ?? "N/A";
    const keyEmployeeAssets = result["Key Employee Assets"] ?? "N/A";
    const topHeavyPct = result["Top Heavy Percentage (%)"] ?? "N/A";
    const testRes = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Total Plan Assets", totalAssets],
      ["Key Employee Assets", keyEmployeeAssets],
      ["Top Heavy Percentage (%)", topHeavyPct],
      ["Test Result", testRes],
    ];

    if (testRes.toLowerCase() === "failed") {
      const correctiveActions = [
        "Ensure key employees hold no more than 60% of total plan assets.",
        "Provide additional employer contributions for non-key employees.",
        "Review and adjust contribution allocations per IRS § 416.",
      ];
      const consequences = [
        "Mandatory employer contributions (3% of pay) for non-key employees.",
        "Potential loss of plan tax advantages if not corrected.",
        "Increased IRS audit risk due to noncompliance.",
        "Possible penalties or disqualification risks.",
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
    link.setAttribute("download", "top_heavy_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 6. Export to PDF with Firebase Storage Integration -----
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    let pdfBlob;
    try {
      const totalEmployees = result["Total Employees"] ?? "N/A";
      const totalAssets = result["Total Plan Assets"] ?? "N/A";
      const keyEmployeeAssets = result["Key Employee Assets"] ?? "N/A";
      const topHeavyPct = result["Top Heavy Percentage (%)"] ?? "N/A";
      const testRes = result["Test Result"] ?? "N/A";
      const failed = testRes.toLowerCase() === "failed";

      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Top Heavy Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear || "N/A"}`, 105, 25, { align: "center" });
      const generatedTimestamp = new Date().toLocaleString();
      pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

      // Results Table
      pdf.autoTable({
        startY: 40,
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", totalEmployees],
          ["Total Plan Assets", formatCurrency(totalAssets)],
          ["Key Employee Assets", formatCurrency(keyEmployeeAssets)],
          ["Top Heavy Percentage (%)", formatPercentage(topHeavyPct)],
          ["Test Result", testRes],
        ],
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 12, font: "helvetica" },
        margin: { left: 15, right: 15 },
      });

      // If test failed, add corrective actions & consequences
      if (failed) {
        const correctiveActions = [
          "Ensure key employees hold no more than 60% of total plan assets.",
          "Provide additional employer contributions for non-key employees.",
          "Review and adjust contribution allocations per IRS § 416.",
        ];
        const consequences = [
          "Mandatory employer contributions (3% of pay) for non-key employees.",
          "Potential loss of plan tax advantages if not corrected.",
          "Increased IRS audit risk due to noncompliance.",
          "Possible penalties or disqualification risks.",
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
        pdf.save("Top_Heavy_Results.pdf");
      } catch (error) {
        setError(`❌ Error exporting PDF: ${error.message}`);
        return;
      }
      try {
        await savePdfResultToFirebase({
          fileName: "Top_Heavy_Test",
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

  // ----- 8. Render -----
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload Top Heavy File
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
          <h3 className="font-bold text-xl text-gray-700">Top Heavy Test Results</h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong>Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {planYear || "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong>Total Employees:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg">
              <strong>Total Plan Assets:</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatCurrency(result?.["Total Plan Assets"])}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong>Key Employee Assets:</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatCurrency(result?.["Key Employee Assets"])}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong>Top Heavy Percentage:</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatPercentage(result?.["Top Heavy Percentage (%)"])}
              </span>
            </p>
            <p className="text-lg mt-2">
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
                  <li>
                    Ensure key employees hold no more than 60% of total plan assets.
                  </li>
                  <br />
                  <li>
                    Provide additional employer contributions for non-key employees.
                  </li>
                  <br />
                  <li>
                    Review and adjust contribution allocations per IRS § 416.
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Mandatory employer contributions (3% of pay) for non-key employees.</li>
                  <br />
                  <li>Loss of plan tax advantages if not corrected.</li>
                  <br />
                  <li>Increased IRS audit risk due to noncompliance.</li>
                  <br />
                  <li>Additional corrective contributions may be required.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TopHeavyTest;
