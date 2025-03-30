import React, { useState, useCallback } from "react";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Firebase Storage export helper
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";

const HealthFSAKeyEmployeeConcentrationTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState("");

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Format Helpers
  const formatCurrency = (amount) =>
    !amount || isNaN(amount)
      ? "N/A"
      : `$${parseFloat(amount).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  const formatPercentage = (value) =>
    !value || isNaN(value) ? "N/A" : `${parseFloat(value).toFixed(2)}%`;

  // Handle Enter key for upload
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // Drag & Drop Logic
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // Upload Handler
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
    formData.append("selected_tests", "health_fsa_key_employee_concentration");

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      const response = await axios.post(
        `${API_URL}/upload-csv/health_fsa_key_employee_concentration`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResult(response.data?.["Test Results"]?.["health_fsa_key_employee_concentration"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response?.data || err.message);
      if (err.response?.status === 405) {
        setError("❌ Server rejected the request (405 Method Not Allowed). Check the endpoint and HTTP method.");
      } else {
        setError("❌ Failed to upload file. Please check the format and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // CSV Template Download
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "Health FSA Benefits",
        "Key Employee",
        "DOB",
        "DOH",
        "Employment Status",
        "Excluded from Test",
        "Plan Entry Date",
        "Union Employee",
        "Part-Time / Seasonal",
      ],
      ["Last", "First", "E001", "125000", "Yes", "1980-05-12", "2015-03-01", "Active", "No", "2015-04-01", "No", "Yes"],
      ["Last", "First", "E002", "10000", "No", "1995-07-20", "2020-06-15", "Active", "No", "2020-07-01", "No", "No"],
      ["Last", "First", "E003", "15000", "No", "1988-11-03", "2018-01-10", "Active", "No", "2018-02-01", "No", "No"],
      ["Last", "First", "E004", "30000", "Yes", "1979-02-28", "2010-09-23", "Active", "No", "2010-10-01", "No", "No"],
      ["Last", "First", "E005", "5000", "No", "1990-12-11", "2016-04-19", "Active", "No", "2016-05-01", "No", "No"],
      ["Last", "First", "E006", "20000", "No", "1992-03-05", "2014-08-30", "Active", "No", "2014-09-01", "No", "No"],
      ["Last", "First", "E007", "60000", "Yes", "1985-06-17", "2008-11-11", "Active", "No", "2008-12-01", "No", "No"],
      ["Last", "First", "E008", "8000", "No", "1991-09-30", "2017-07-22", "Active", "No", "2017-08-01", "No", "No"],
      ["Last", "First", "E009", "12000", "No", "1983-01-26", "2012-10-05", "Active", "No", "2012-11-01", "No", "No"],
      ["Last", "First", "E010", "7000", "No", "1987-04-14", "2011-12-17", "Active", "No", "2012-01-01", "No", "No"],
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Health_FSA_Key_Employee_Concentration_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Results Download
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      ["Total Health FSA Benefits", result["Total Health FSA Benefits"] ?? "N/A"],
      ["Key Employee Benefits", result["Key Employee Benefits"] ?? "N/A"],
      ["Key Employee Benefit Percentage", result["Key Employee Benefit Percentage"] ? formatPercentage(result["Key Employee Benefit Percentage"]) : "N/A"],
      ["Test Result", result["Test Result"] ?? "N/A"],
    ];

    if (result["Test Result"]?.toLowerCase() === "failed") {
      const correctiveActions = [
        "Review the allocation of Health FSA benefits to ensure key employees do not exceed the concentration limit.",
        "Adjust plan eligibility criteria or contribution formulas to lower the benefit concentration among key employees.",
        "Consider rebalancing contributions to promote a more equitable benefit distribution.",
      ];
      const consequences = [
        "Potential reclassification of Health FSA benefits as taxable for key employees.",
        "Increased corrective contributions or adjustments may be required from the employer.",
        "Heightened risk of IRS penalties and compliance audits.",
      ];
      csvRows.push([], ["Corrective Actions"], ...correctiveActions.map(action => ["", action]));
      csvRows.push([], ["Consequences"], ...consequences.map(item => ["", item]));
    }

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Health_FSA_Eligibility_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export with Firebase Storage Integration
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    let pdfBlob;
    try {
      const testResult = result["Test Result"] ?? "N/A";
      const failed = testResult.toLowerCase() === "failed";
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Health FSA Key Employee Concentration Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

      // Table with Results
      pdf.autoTable({
        startY: 44,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Health FSA Benefits", formatCurrency(result["Total Health FSA Benefits"])],
          ["Key Employee Benefits", formatCurrency(result["Key Employee Benefits"])],
          ["Key Employee Benefit Percentage", formatPercentage(result["Key Employee Benefit Percentage"])],
          ["Test Result", testResult],
        ],
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 12, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });

      // Corrective actions & consequences (if test failed)
      if (failed) {
        const y = pdf.lastAutoTable.finalY + 10;
        pdf.setFillColor(255, 230, 230);
        pdf.setDrawColor(255, 0, 0);
        pdf.rect(10, y, 190, 30, "FD");
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Corrective Actions:", 15, y + 7);
        const actions = [
          "• Review the allocation of Health FSA benefits",
          "• Adjust plan eligibility criteria or contribution formulas",
          "• Consider rebalancing contributions",
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
          "• Taxation of FSA benefits for HCEs",
          "• Increased IRS scrutiny and potential penalties",
          "• Risk of plan disqualification",
          "• Retroactive correction requirements",
        ];
        consequences.forEach((item, i) => pdf.text(item, 15, y2 + 18 + i * 5));
      }

      // Footer
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100, 100, 100);
      pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

      // Generate PDF blob and trigger local download
      pdfBlob = pdf.output("blob");
      pdf.save("Health_FSA_Key_Employee_Concentration_Results.pdf");
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }
    try {
      await savePdfResultToFirebase({
        fileName: "Health_FSA_Key_Employee_Concentration_Test",
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
        📂 Upload Health FSA Key Employee Concentration File
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
            Drag & drop a <strong>CSV or Excel file</strong> here, or{" "}
            <span className="text-blue-500 font-semibold">click to browse</span>
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
        onClick={() => open()}
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
            Health FSA Key Employee Concentration Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {planYear || "N/A"}
              </span>
            </p>
            <p className="text-lg">
              <strong className="text-gray-700">Total Health FSA Benefits:</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatCurrency(result["Total Health FSA Benefits"])}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Key Employee Benefits:</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatCurrency(result["Key Employee Benefits"])}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Key Employee Benefit Percentage:</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatPercentage(result["Key Employee Benefit Percentage"])}
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

          {result["Test Result"] === "Failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>
                    Review the allocation of Health FSA benefits to ensure key employees do not exceed the concentration limit.
                  </li>
                  <li>
                    Adjust plan eligibility criteria or contribution formulas to lower the benefit concentration among key employees.
                  </li>
                  <li>
                    Consider rebalancing contributions to promote a more equitable benefit distribution.
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>
                    Potential reclassification of Health FSA benefits as taxable for key employees.
                  </li>
                  <li>
                    Increased corrective contributions or adjustments may be required from the employer.
                  </li>
                  <li>
                    Heightened risk of IRS penalties and compliance audits.
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthFSAKeyEmployeeConcentrationTest;
