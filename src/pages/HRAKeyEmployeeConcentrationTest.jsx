import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import CsvTemplateDownloader from "../components/CsvTemplateDownloader"; // Adjust path as needed
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const HRAKeyEmployeeConcentrationTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year state

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // =========================
  // 1. Helpers for Formatting
  // =========================
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return "N/A";
    }
    // Example: "$12,345.67"
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return "N/A";
    }
    // Example: "65.43%"
    return `${Number(value).toFixed(2)}%`;
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
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

  // Trigger upload on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

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
    formData.append("selected_tests", "hra_key_employee_concentration");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/hra_key_employee_concentration`);

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
        `${API_URL}/upload-csv/hra_key_employee_concentration`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["hra_key_employee_concentration"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Download results as CSV
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalHraBenefits = result["Total HRA Benefits"] ?? "N/A";
    const keyEmployeeBenefits = result["Key Employee Benefits"] ?? "N/A";
    const keyEmployeeBenefitPercentage = result["Key Employee Benefit Percentage"] ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total HRA Benefits", totalHraBenefits],
      ["Key Employee Benefits", keyEmployeeBenefits],
      ["Key Employee Benefit Percentage", keyEmployeeBenefitPercentage],
      ["Test Result", testResult],
    ];

    if (testResult.toLowerCase() === "failed") {
      const correctiveActions = [
        "Review and adjust the allocation of HRA benefits for key employees.",
        "Modify plan design to lower the concentration among key employees.",
        "Reevaluate eligibility criteria to ensure compliance.",
      ];
      const consequences = [
        "Benefits for key employees may be reclassified as taxable.",
        "Employer may need to make corrective contributions.",
        "Increased IRS scrutiny and potential penalties.",
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
    link.setAttribute("download", "HRA_Key_Employee_concentration_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export results to PDF
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    const plan = planYear || "N/A";
    const totalHraBenefits = formatCurrency(result["Total HRA Benefits"]) ?? "N/A";
    const keyEmployeeBenefits = formatCurrency(result["Key Employee Benefits"]) ?? "N/A";
    const keyEmployeeBenefitPercentage = formatPercentage(result["Key Employee Benefit Percentage"]) ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";

    const failed = testResult.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("HRA Key Employee Concentration Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${plan}`, 105, 25, { align: "center" });

    // Section 1: Basic Results Table
    pdf.autoTable({
      startY: 40,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total HRA Benefits", totalHraBenefits],
        ["Key Employee Benefits", keyEmployeeBenefits],
        ["Key Employee Benefit Percentage", `${keyEmployeeBenefitPercentage}%`],
        ["Test Result", testResult],
      ],
      styles: {
        fontSize: 12,
        textColor: [0, 0, 0],
        halign: "right",
      },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold" },
        1: { halign: "left" },
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 12,
        fontStyle: "helvetica",
        halign: "left",
      },
      margin: { left: 15, right: 15 },
    });

    const summaryStartY = pdf.lastAutoTable.finalY + 10;

    if (failed) {
      // Section 2: If Failed, add Corrective Actions & Consequences
      pdf.setFillColor(255, 230, 230);
      pdf.setDrawColor(255, 0, 0);
      const correctiveBoxHeight = 35;
      pdf.rect(10, summaryStartY, 190, correctiveBoxHeight, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(255, 0, 0);
      pdf.text("Corrective Actions", 15, summaryStartY + 10);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      let bulletY = summaryStartY + 14;
      const lineHeight = 5;

      const correctiveActions = [
        "Review and adjust the allocation of HRA benefits for key employees.",
        "Modify plan design to lower the concentration among key employees.",
        "Reevaluate eligibility criteria to ensure compliance.",
      ];

      correctiveActions.forEach((action) => {
        pdf.text(`• ${action}`, 15, bulletY);
        bulletY += lineHeight;
      });

      // Consequences Box
      const nextBoxY = summaryStartY + correctiveBoxHeight + 5;
      pdf.setFillColor(255, 255, 204);
      pdf.setDrawColor(255, 204, 0);
      pdf.rect(10, nextBoxY, 190, 40, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(204, 153, 0);
      pdf.text("Consequences", 15, nextBoxY + 10);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      let bulletY2 = nextBoxY + 18;
      const consequences = [
        "Benefits for key employees may be reclassified as taxable.",
        "Employer may need to make corrective contributions.",
        "Increased IRS scrutiny and potential penalties.",
      ];
      consequences.forEach((item) => {
        pdf.text(`• ${item}`, 15, bulletY2);
        bulletY2 += lineHeight;
      });
    }

    // Footer
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Generated by HRA Key Employee Concentration Test Tool", 10, 290);

    pdf.save("hra_key_employee_concentration_Results.pdf");
  };

   // =========================
  // 6. Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      ["Name", "HRA Benefits", "Key Employee"],
      ["Employee 1", "2342", "Yes"],
      ["Employee 2", "4354", "No"],
      ["Employee 3", "34543", "No"],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "HRA_Key_Emp_Con_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload HRA Key Employee Concentration File
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
          <h3 className="font-bold text-xl text-gray-700">HRA Key Employee Concentration Test Results</h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
            </p>
            <p>
              <p className="text-lg">
              <strong className="text-gray-700">Total HRA Benefits:</strong>{" "}
              {formatCurrency(result["Total HRA Benefits"] ?? "N/A")}
                </p>
                <p className="text-lg"></p>
              <strong className="text-gray-700">Key Employee Benefits:</strong> {""}
              {formatCurrency(result["Key Employee Benefits"] ?? "N/A")}
            </p>
            <p>
              <strong>Key Employee Benefit:</strong> {result?.["Key Employee Benefit Percentage"] ?? "N/A"}%
            </p>
            <p>
              <strong>Test Result:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-md font-bold ${
                  result?.["Test Result"] === "Passed" ? "bg-green-500 text-white" : "bg-red-500 text-white"
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

          {/* Corrective Actions and Consequences if Test Failed */}
          {result?.["Test Result"] === "Failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Review and adjust the allocation of HRA benefits for key employees.</li>
                  <br />
                  <li>Modify plan design to lower the concentration among key employees.</li>
                  <br />
                  <li>Reevaluate eligibility criteria to ensure compliance.</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ Benefits for key employees may be reclassified as taxable.</li>
                  <br />
                  <li>❌ Employer may need to make corrective contributions.</li>
                  <br />
                  <li>❌ Increased IRS scrutiny and potential penalties.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HRAKeyEmployeeConcentrationTest;
