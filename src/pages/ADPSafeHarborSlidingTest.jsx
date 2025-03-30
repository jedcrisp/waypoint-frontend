import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth"; // Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Firebase PDF saver

const ADPSafeHarborSlidingTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year selection state

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // ---------- Formatting Helpers ----------
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(Number(value)))
      return "N/A";
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(Number(value)))
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
    accept: ".csv, .xlsx", // Accept CSV & Excel files
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
    formData.append("selected_tests", "adp_safe_harbor_sliding");

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      const response = await axios.post(
        `${API_URL}/upload-csv/adp_safe_harbor_sliding`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // Expected response structure:
      // {
      //   "Test Results": {
      //     "adp_safe_harbor_sliding": {
      //       "Total Employees": 120,
      //       "HCE ADP (%)": 55,
      //       "IRS Safe Harbor Limit": 75,
      //       "NHCE ADP (%)": 45,
      //       "Test Result": "Passed" // or "Failed"
      //     }
      //   }
      // }
      const safeHarborResults =
        response.data?.["Test Results"]?.["adp_safe_harbor_sliding"];
      if (!safeHarborResults) {
        setError(
          "❌ No Safe Harbor Sliding Scale test results found in response."
        );
      } else {
        console.log("Received Safe Harbor Sliding Scale result:", safeHarborResults);
        setResult(safeHarborResults);
      }
    } catch (err) {
      console.error(
        "❌ Upload error:",
        err.response ? err.response.data : err
      );
      setError("❌ Failed to upload file. Please check the format and try again.");
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
  ["Last Name", "First Name", "Employee ID", "Compensation", "Employee Deferral", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"],
  ["Last", "First", "001", 80000, 4000, "Yes", "1980-05-10", "2010-06-01", "Active", "No", "2011-01-01", "No", "No"],
  ["Last", "First", "002", 75000, 3000, "No", "1985-08-15", "2012-03-10", "Active", "No", "2013-01-01", "No", "No"],
  ["Last", "First", "003", 62000, 2800, "No", "1990-01-01", "2020-05-01", "Active", "No", "2021-01-01", "No", "No"],
  ["Last", "First", "004", 98000, 4900, "Yes", "1978-10-30", "2008-07-12", "Active", "No", "2009-01-01", "No", "No"],
  ["Last", "First", "005", 56000, 1500, "No", "1995-04-12", "2021-08-20", "Active", "No", "2022-01-01", "No", "No"],
  ["Last", "First", "006", 71000, 3550, "Yes", "1987-05-14", "2015-11-11", "Active", "Yes", "2016-01-01", "No", "No"],
  ["Last", "First", "007", 45000, 500, "No", "1998-01-05", "2023-09-10", "Active", "No", "2023-10-01", "No", "Yes"],
  ["Last", "First", "008", 69000, 3450, "No", "1983-03-25", "2016-11-01", "Active", "No", "2017-01-01", "No", "No"],
  ["Last", "First", "009", 90000, 6000, "Yes", "1981-06-22", "2009-07-07", "Active", "No", "2010-01-01", "No", "No"],
  ["Last", "First", "010", 51000, 2000, "No", "1999-09-12", "2022-01-10", "Active", "No", "2023-01-01", "No", "No"],
]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ADP_Safe_Harbor_Sliding_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 5. Download Results as CSV (with corrective actions & consequences if failed) -----
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const hceADP = result["HCE ADP (%)"] ?? "N/A";
    const nhceADP = result["NHCE ADP (%)"] ?? "N/A";
    const safeHarborLimit = result["IRS Safe Harbor Limit"] ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["HCE ADP (%)", hceADP],
      ["NHCE ADP (%)", nhceADP],
      ["IRS Safe Harbor Limit (%)", safeHarborLimit],
      ["Test Result", testResult],
    ];

    if (testResult.toLowerCase() === "failed") {
      const correctiveActions = [
        "Refund Excess Contributions by the required deadline.",
        "Make Additional Contributions as required.",
        "Recharacterize excess contributions appropriately.",
      ];
      const consequences = [
        "Excess Contributions Must Be Refunded",
        "IRS Penalties and Compliance Risks",
        "Loss of Tax Benefits",
        "Plan Disqualification Risk",
        "Employee Dissatisfaction & Legal Risks",
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
    link.setAttribute("download", "Safe_Harbor_Sliding_Test_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 6. Export to PDF (ACP-style layout for Safe Harbor Sliding Scale Test) -----
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const hceADP = result["HCE ADP (%)"] ?? "N/A";
    const nhceADP = result["NHCE ADP (%)"] ?? "N/A";
    const safeHarborLimit = result["IRS Safe Harbor Limit"] ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";
    const failed = testResult.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Safe Harbor Sliding Scale Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${plan}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

    // Section 1: Basic Results Table
    pdf.autoTable({
      startY: 40,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", totalEmployees],
        ["HCE ADP (%)", formatPercentage(result?.["HCE ADP (%)"])],
        ["NHCE ADP (%)", formatPercentage(result?.["NHCE ADP (%)"])],
        ["IRS Safe Harbor Limit (%)", formatPercentage(result?.["IRS Safe Harbor Limit"])],
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

    // If test failed, add corrective actions & consequences
    if (failed) {
      const correctiveActions = [
        "Refund Excess Contributions by the required deadline.",
        "Make Additional Contributions as required.",
        "Recharacterize excess contributions appropriately.",
      ];
      const consequences = [
        "Excess Contributions Must Be Refunded",
        "IRS Penalties and Compliance Risks",
        "Loss of Tax Benefits",
        "Plan Disqualification Risk",
        "Employee Dissatisfaction & Legal Risks",
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
        body: consequences.map((consequence) => [consequence]),
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

    let pdfBlob;
    try {
      pdfBlob = pdf.output("blob");
      pdf.save("Safe_Harbor_Sliding_Test_Results.pdf");
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }
    try {
      await savePdfResultToFirebase({
        fileName: "ADP Safe Harbor Sliding Test",
        pdfBlob,
        additionalData: {
          planYear,
          testResult: testResult || "Unknown",
        },
      });
    } catch (error) {
      setError(`❌ Error saving PDF to Firebase: ${error.message}`);
    }
  };

  // ----- RENDER -----
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload ADP Safe Harbor Sliding Scale File
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
          <h3 className="font-bold text-xl text-gray-700 flex items-center">
            Safe Harbor Sliding Scale Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {planYear || "N/A"}
              </span>
            </p>
            <p className="text-lg">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              {result["Total Employees"] ?? "N/A"}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">HCE ADP (%):</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatPercentage(result?.["HCE ADP (%)"])}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">NHCE ADP (%):</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatPercentage(result?.["NHCE ADP (%)"])}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">IRS Safe Harbor Limit (%):</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatPercentage(result?.["IRS Safe Harbor Limit"])}
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
          </div>

              result["Test Result"].toLowerCase() === "failed" && (
                <>
                  <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                    <h4 className="font-bold text-black-600">
                      Corrective Actions:
                    </h4>
                    <ul className="list-disc list-inside text-black-600">
                      <li>
                        Refund Excess Contributions to HCEs by March 15 to avoid
                        penalties.
                      </li>
                      <br />
                      <li>
                        Make Additional Contributions to NHCEs via QNEC or QMAC.
                      </li>
                      <br />
                      <li>
                        Recharacterize Excess HCE Contributions as Employee
                        Contributions.
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                    <h4 className="font-bold text-black-600">
                      Consequences:
                    </h4>
                    <ul className="list-disc list-inside text-black-600">
                      <li>Excess Contributions Must Be Refunded</li>
                      <br />
                      <li>IRS Penalties and Compliance Risks</li>
                      <br />
                      <li>Loss of Tax Benefits for HCEs</li>
                      <br />
                      <li>Plan Disqualification Risk</li>
                      <br />
                      <li>
                       Employee Dissatisfaction & Legal Risks
                      </li>
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

export default ADPSafeHarborSlidingTest;
