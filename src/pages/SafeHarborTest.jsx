import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ADPSafeHarborTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // =========================
  // Helpers for Formatting
  // =========================
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return "N/A";
    }
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return "N/A";
    }
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
    formData.append("selected_tests", "safe_harbor");

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/upload-csv/safe_harbor`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data?.["Test Results"]?.["safe_harbor"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 3. Download CSV Template
  // =========================
 const downloadCSVTemplate = () => {
  // Define CSV data as an array of arrays
  const csvData = [
    ["Last Name", "First Name", "Employee ID", "Eligible for Cafeteria Plan", "Employer Contribution", "Cafeteria Plan Benefits", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date"],
    ["Last", "First", "001", "Yes", "3", "1500", "No", "1980-04-12", "2015-06-01", "Active", "No", "2016-01-01"],
    ["Last", "First", "002", "Yes", "3", "1800", "Yes", "1985-11-03", "2019-01-15", "Active", "No", "2022-04-04"],
    ["Last", "First", "003", "No", "0", "0", "No", "1990-01-01", "2021-05-01", "Active", "No", "2021-05-01"],
    ["Last", "First", "004", "Yes", "4", "2000", "Yes", "1979-09-10", "2005-07-12", "Active", "No", "2005-07-12"],
    ["Last", "First", "005", "No", "0", "0", "No", "2000-12-01", "2022-08-20", "Terminated", "No", "2022-08-20"],
    ["Last", "First", "006", "Yes", "3", "1700", "No", "1992-05-14", "2021-04-10", "Active", "Yes", "2021-04-10"],
    ["Last", "First", "007", "No", "0", "0", "No", "2002-01-05", "2023-09-10", "Active", "No", "2023-09-10"],
    ["Last", "First", "008", "Yes", "3", "1900", "Yes", "1980-03-25", "2015-11-01", "Active", "No", "2015-11-01"],
    ["Last", "First", "009", "Yes", "4", "2100", "Yes", "1982-06-22", "2011-07-07", "Active", "No", "2011-07-07"],
    ["Last", "First", "010", "No", "0", "0", "No", "2003-09-12", "2023-01-10", "Active", "No", "2023-01-10"], 
  ];

  // Convert each row to a comma-separated string and join with newlines
  const csvTemplate = csvData.map((row) => row.join(",")).join("\n");

  // Create a Blob with CSV content
  const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // Create a temporary link to trigger download
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "Safe_Harbor_Template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  // =========================
  // 4. Download Results as CSV
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    // We'll keep the raw numeric data in CSV
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const eligibleEmployees = result["Eligible Employees"] ?? "N/A";
    const eligibilityPercentage = result["Eligibility Percentage (%)"] ?? "N/A";
    const averageEmployerContribution = result["Average Employer Contribution (%)"] ?? "N/A";
    const hceBenefits = result["HCE Benefits (Avg)"] ?? "N/A";
    const nhceBenefits = result["NHCE Benefits (Avg)"] ?? "N/A";
    const benefitRatio = result["Benefit Ratio (%)"] ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Eligible Employees", eligibleEmployees],
      ["Eligibility Percentage (%)", eligibilityPercentage],
      ["Average Employer Contribution (%)", averageEmployerContribution],
      ["HCE Benefits (Avg)", hceBenefits],
      ["NHCE Benefits (Avg)", nhceBenefits],
      ["Benefit Ratio (%)", benefitRatio],
      ["Test Result", testResult],
    ];

    if (String(testResult).toLowerCase() === "failed") {
      const correctiveActions = [
        "Adjust eligibility requirements to ensure NHCEs meet the 70% threshold.",
        "Modify plan design to allow more NHCEs to participate.",
        "Ensure compliance with the Ratio Percentage Test (70% of HCE rate).",
        "Review employee demographics to adjust contribution structures.",
      ];
      const consequences = [
        "Plan may lose tax-qualified status",
        "HCEs may have contributions refunded, reducing their tax benefits",
        "Additional corrective employer contributions may be required",
        "Increased IRS audit risk due to compliance failure",
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
    link.setAttribute("download", "Safe_Harbor_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 5. Export to PDF (with formatting)
  // =========================
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    // Convert raw data to strings with formatting
    const plan = planYear || "N/A";
    const totalEmployees = String(result["Total Employees"] ?? "N/A");
    const eligibleEmployees = String(result["Eligible Employees"] ?? "N/A");

    const eligibilityPercentage = formatPercentage(result["Eligibility Percentage (%)"]);
    const averageEmployerContribution = formatCurrency(result["Average Employer Contribution (%)"]);
    const hceBenefits = formatCurrency(result["HCE Benefits (Avg)"]);
    const nhceBenefits = formatCurrency(result["NHCE Benefits (Avg)"]);

    // For ratio, we want "xxx.xx%"
    let ratioVal = result["Benefit Ratio (%)"];
    const benefitRatio = isNaN(ratioVal) ? "N/A" : `${Number(ratioVal).toFixed(2)}%`;

    const testResult = String(result["Test Result"] ?? "N/A");
    const failed = testResult.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Safe Harbor Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${plan}`, 105, 25, { align: "center" });
    const generatedTimestamp = new Date().toLocaleString();
    pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

    // Section 1: Basic Results Table
    pdf.autoTable({
      startY: 40,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", totalEmployees],
        ["Eligible Employees", eligibleEmployees],
        ["Eligibility Percentage (%)", eligibilityPercentage],
        ["Average Employer Contribution", averageEmployerContribution],
        ["HCE Benefits (Avg)", hceBenefits],
        ["NHCE Benefits (Avg)", nhceBenefits],
        ["Benefit Ratio (%)", benefitRatio],
        ["Test Result", testResult],
      ],
      headStyles: {
        fillColor: [41, 128, 185], // Blue
        textColor: [255, 255, 255], // White text
      },
      styles: {
        fontSize: 12,
        font: "helvetica",
      },
      margin: { left: 10, right: 10 },
    });

    // Section 2: Summary Box
    const summaryStartY = pdf.lastAutoTable.finalY + 10;
    const boxWidth = 190;
    const boxHeight = 0;

    //pdf.setDrawColor(0, 0, 0);
    //pdf.setLineWidth(0.0);
    //pdf.rect(10, summaryStartY, boxWidth, boxHeight, "S");

    //pdf.setFontSize(10);
    //pdf.setFont("helvetica", "bold");
    //if (failed) {
      //pdf.text("", 12, summaryStartY + 8);
    //} else {
      //pdf.text("", 12, summaryStartY + 8);
    //}

    //pdf.setFontSize(10);
    //pdf.setFont("helvetica", "normal");
    //pdf.text(
      //"",
      //12,
      //summaryStartY + 14,
      //{ maxWidth: 0 }
    //);

    // Section 3: If Failed, add Corrective Actions & Consequences
    if (failed) {
      const correctiveBoxY = summaryStartY + boxHeight + 5;
      pdf.setFillColor(255, 230, 230);
      pdf.setDrawColor(255, 0, 0);
      const correctiveBoxHeight = 35;
      pdf.rect(10, correctiveBoxY, boxWidth, correctiveBoxHeight, "FD");

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 0, 0);
      pdf.text("Corrective Actions", 15, correctiveBoxY + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      let bulletY = correctiveBoxY + 14;
      const lineHeight = 5;
      const correctiveActions = [
        "Adjust eligibility requirements to ensure NHCEs meet the 70% threshold.",
        "Modify plan design to allow more NHCEs to participate.",
        "Ensure compliance with the Ratio Percentage Test.",
        "Review employee demographics to adjust contribution structures.",
      ];
      correctiveActions.forEach((action) => {
        pdf.text(`• ${action}`, 15, bulletY);
        bulletY += lineHeight;
      });

      const consequencesBoxY = correctiveBoxY + correctiveBoxHeight + 5;
      pdf.setFillColor(255, 255, 204);
      pdf.setDrawColor(255, 204, 0);
      const consequencesBoxHeight = 40;
      pdf.rect(10, consequencesBoxY, boxWidth, consequencesBoxHeight, "FD");

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(204, 153, 0);
      pdf.text("Consequences", 15, consequencesBoxY + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      let bulletY2 = consequencesBoxY + 14;
      const consequences = [
        "Plan may lose tax-qualified status",
        "Additional corrective employer contributions may be required.",
        "Increased IRS audit risk due to compliance failure.",
        "HCEs may have contributions refunded, reducing their tax benefits",
      ];
      consequences.forEach((item) => {
        pdf.text(`• ${item}`, 15, bulletY2);
        bulletY2 += lineHeight;
      });
    }

    // Footer
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Generated via the Waypoing Reporting Engine", 10, 290);

    pdf.save("Safe_Harbor_Results.pdf");
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
        📂 Upload ADP Safe Harbor Coverage File
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
          <h3 className="font-bold text-xl text-gray-700">Safe Harbor Coverage Test Results</h3>
          <div className="mt-4">
            {/* Show plan year */}
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
            </p>

            {/* Show numeric data with formatting */}
            <p className="text-lg">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              <span className="font-semibold text-blue-600">
               {result["Total Employees"] ?? "N/A"}
             </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligible Employees:</strong>{" "}
              {result["Eligible Employees"] ?? "N/A"}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligibility Percentage:</strong>{" "}
              {formatPercentage(result["Eligibility Percentage (%)"])}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Average Employer Contribution:</strong>{" "}
              {formatCurrency(result["Average Employer Contribution (%)"])}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">HCE Benefits (Avg):</strong>{" "}
              {formatCurrency(result["HCE Benefits (Avg)"])}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">NHCE Benefits (Avg):</strong>{" "}
              {formatCurrency(result["NHCE Benefits (Avg)"])}
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Benefit Ratio (%):</strong>{" "}
              {formatPercentage(result["Benefit Ratio (%)"])}
            </p>

            {/* Test Result */}
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
                  <li>Adjust eligibility requirements to ensure NHCEs meet the 70% threshold.</li>
                  <br />
                  <li>Modify plan design to allow more NHCEs to participate.</li>
                  <br />
                  <li>Ensure compliance with the Ratio Percentage Test.</li>
                  <br />
                  <li>Review employee demographics to adjust contribution structures.</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ Plan may lose tax-qualified status.</li>
                  <br />
                  <li>❌ HCEs may have contributions refunded, reducing their tax benefits.</li>
                  <br />
                  <li>❌ Additional corrective employer contributions may be required.</li>
                  <br />
                  <li>❌ Increased IRS audit risk due to compliance failure.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ADPSafeHarborTest;
