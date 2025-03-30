import React, { useState, useCallback } from "react";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Integrated from DCAP contributions
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const DCAPKeyEmployeeConcentrationTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // =========================
  //  Helper Functions
  // =========================
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
    formData.append("selected_tests", "dcap_key_employee_concentration");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/dcap_key_employee_concentration`);

      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/upload-csv/dcap_key_employee_concentration`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["dcap_key_employee_concentration"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 3. Handle Enter Key
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // =========================
  // 4. Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "DCAP Benefits",
        "Key Employee",
        "DOB",
        "DOH",
        "Employment Status",
        "Excluded from Test",
        "Plan Entry Date",
        "Union Employee",
        "Part-Time / Seasonal"
      ],
      ["Last", "First", "001", "$1,000.00", "Yes", "1980-05-10", "2010-06-01", "Active", "No", "2011-01-01", "No", "No"],
      ["Last", "First", "002", "$1,500.00", "No", "1985-08-15", "2012-03-10", "Active", "No", "2013-01-01", "No", "Yes"],
      ["Last", "First", "003", "$2,000.00", "Yes", "1975-01-20", "2005-05-05", "Active", "No", "2006-01-01", "Yes", "No"],
      ["Last", "First", "004", "$1,200.00", "No", "1990-12-01", "2020-08-20", "Active", "Yes", "2021-01-01", "No", "No"],
      ["Last", "First", "005", "$1,800.00", "Yes", "1995-07-19", "2021-04-10", "Leave", "No", "2022-01-01", "No", "Yes"],
      ["Last", "First", "006", "$1,100.00", "No", "1982-11-03", "2009-11-01", "Active", "No", "2010-01-01", "Yes", "No"],
      ["Last", "First", "007", "$1,300.00", "Yes", "2001-04-25", "2022-09-15", "Active", "No", "2023-01-01", "No", "No"],
      ["Last", "First", "008", "$1,600.00", "No", "1978-02-14", "2000-01-01", "Terminated", "No", "2001-01-01", "Yes", "Yes"],
      ["Last", "First", "009", "$1,400.00", "Yes", "1999-06-30", "2019-03-05", "Active", "No", "2020-01-01", "No", "No"],
      ["Last", "First", "010", "$1,700.00", "No", "2003-09-12", "2023-01-10", "Active", "No", "2023-07-01", "Yes", "Yes"],
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "DCAP_Key_Employee_Concentration_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 5. Download Results as CSV
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      ["Total Employees", result["Total Employees"] ?? "N/A"],
      ["Total Participants", result["Total Participants"] ?? "N/A"],
      ["Key Employee Benefits", result["Key Employee Benefits"] ?? "N/A"],
      [
        "Key Employee Benefit Percentage",
        result["Key Employee Benefit Percentage"]
          ? `${result["Key Employee Benefit Percentage"]}%`
          : "N/A"
      ],
      ["Total DCAP Benefits", result["Total DCAP Benefits"] ?? "N/A"],
      ["Test Result", result["Test Result"] ?? "N/A"],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "DCAP_Key_Employee_Concentration_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 6. Export to PDF
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
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        "Test Criterion: Key employee benefits must not exceed 25% of total DCAP benefits",
        105,
        38,
        { align: "center", maxWidth: 180 }
      );

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("DCAP Key Employee Concentration Test Results", 105, 15, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
      const generatedTimestamp = new Date().toLocaleString();
      pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

      pdf.autoTable({
        startY: 43,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", result["Total Employees"] ?? "N/A"],
          ["Total Participants", result["Total Participants"] ?? "N/A"],
          [
            "Key Employee Benefits",
            result["Key Employee Benefits"] ? formatCurrency(result["Key Employee Benefits"]) : "N/A"
          ],
          [
            "Key Employee Benefit Percentage",
            result["Key Employee Benefit Percentage"] ? `${result["Key Employee Benefit Percentage"]}%` : "N/A"
          ],
          [
            "Total DCAP Benefits",
            result["Total DCAP Benefits"] ? formatCurrency(result["Total DCAP Benefits"]) : "N/A"
          ],
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

      // If test failed, add corrective actions and consequences
      if (result["Test Result"]?.toLowerCase() === "failed") {
        const correctiveActions = [
          "Adjust benefits allocations to reduce concentration among key employees",
          "Consider reallocating contributions for a more balanced distribution",
          "Review and update plan design and eligibility criteria to ensure IRS compliance",
        ];

        const consequences = [
          "Potential reclassification of benefits as taxable income for key employees",
          "Increased corrective contributions may be required",
          "Heightened risk of IRS penalties and additional compliance audits",
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

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100, 100, 100);
      pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);
      pdfBlob = pdf.output("blob");
      pdf.save("DCAP_Key_Employee_Concentration_Results.pdf");
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }

    try {
      // Assuming savePdfResultToFirebase is defined elsewhere
      await savePdfResultToFirebase({
        fileName: "DCAP Key Employee Concentration",
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

  // =========================
  // 7. RENDER
  // =========================
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload DCAP Key Employee Concentration File
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

      {/* "Choose File" Button */}
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
            DCAP Key Employee Concentration Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {planYear || "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Total Participants:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Participants"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Key Employee Benefits:</strong>{" "}
              <span className="font-semibold text-gray-800">
                {result["Key Employee Benefits"]
                  ? formatCurrency(result["Key Employee Benefits"])
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Key Employee Benefit Percentage:</strong>{" "}
              <span className="font-semibold text-gray-800">
                {result["Key Employee Benefit Percentage"]
                  ? formatPercentage(result["Key Employee Benefit Percentage"])
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg">
              <strong className="text-gray-700">Total DCAP Benefits:</strong>{" "}
              <span className="font-semibold text-gray-800">
                {result["Total DCAP Benefits"]
                  ? formatCurrency(result["Total DCAP Benefits"])
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
                  <li>Adjust benefits allocations to reduce the concentration among key employees.</li>
                  <br />
                  <li>Consider reallocating contributions to achieve a more balanced benefit distribution.</li>
                  <br />
                  <li>Review and update plan design and eligibility criteria to ensure IRS compliance.</li>
                </ul>
              </div>
              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Potential reclassification of benefits as taxable income for key employees.</li>
                  <br />
                  <li>Increased corrective contributions may be required from the employer.</li>
                  <br />
                  <li>Heightened risk of IRS penalties and additional compliance audits.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DCAPKeyEmployeeConcentrationTest;
