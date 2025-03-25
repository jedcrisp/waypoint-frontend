import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const RatioPercentageTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year selection

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

  // =========================
  // 2. Drag & Drop Logic
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
  // 3. Upload File to Backend
  // =========================
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
    formData.append("selected_tests", "ratio_percentage");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/ratio_percentage`);

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
      const response = await axios.post(`${API_URL}/upload-csv/ratio_percentage`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["ratio_percentage"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.error || "❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 4. Handle Enter Key
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // =========================
  // 5. Plan Year Dropdown
  // =========================
  const renderPlanYearDropdown = () => (
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
  );

  // =========================
  // 6. Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      ["Name", "Eligible for Plan", "HCE"],
      ["Employee 1", "Yes", "Yes"],
      ["Employee 2", "No", "No"],
      ["Employee 3", "Yes", "No"],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Ratio_Percentage_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 7. Download Results as CSV
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const hceEligibility = result["HCE Eligibility (%)"] ?? "N/A";
    const nhceEligibility = result["NHCE Eligibility (%)"] ?? "N/A";
    const ratioPercentage = result["Ratio Percentage"] ?? "N/A";
    const testRes = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["HCE Eligibility (%)", hceEligibility],
      ["NHCE Eligibility (%)", nhceEligibility],
      ["Ratio Percentage", ratioPercentage],
      ["Test Result", testRes],
    ];

    if (testRes.toLowerCase() === "failed") {
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
    link.setAttribute("download", "Ratio_Percentage_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 8. Export to PDF (With Formatting)
  // =========================
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    const plan = planYear || "N/A";
   
    const hceEligibility = formatPercentage(result["HCE Eligibility (%)"]);
    const nhceEligibility = formatPercentage(result["NHCE Eligibility (%)"]);
    const testResult = String(result["Test Result"] ?? "N/A");
    const failed = testResult.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Ratio Percentage Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${plan}`, 105, 25, { align: "center" });

    // Section 1: Basic Results Table
    pdf.autoTable({
      startY: 40,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["HCE Eligibility (%)", hceEligibility],
        ["NHCE Eligibility (%)", nhceEligibility],
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

    // Section 2: Summary Box
    const summaryStartY = pdf.lastAutoTable.finalY + 10;
    const boxWidth = 190;
    let boxHeight = 0;

    //pdf.setDrawColor(0, 0, 0);
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
      //{ maxWidth: 186 }
    //);

    // Section 3: If Failed, add Corrective Actions & Consequences Boxes
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
        "Increase NHCE participation to ensure at least 70% of the HCE participation rate.",
        "Adjust plan eligibility criteria to include more NHCEs.",
        "Modify plan structure or incentives to encourage NHCE participation.",
        "Review plan design to ensure compliance with IRC § 410(b).",
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
        "Plan may fail the Eligibility Test, impacting its tax-qualified status.",
        "HCE contributions may be limited or refunded.",
        "IRS penalties and potential disqualification risks.",
        "Additional employer contributions may be required for NHCEs.",
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
    pdf.text("Generated by Ratio Percentage Test Tool", 10, 290);

    console.log("Reached end of PDF function");
    pdf.save("Ratio_Percentage_Test_Results.pdf");
  };

  // =========================
  // 9. RENDER
  // =========================
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload Ratio Percentage File
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
          <h3 className="font-bold text-xl text-gray-700">Ratio Percentage Test Results</h3>

          {/* Let's do minimal currency/percentage formatting in the UI as well */}
          {/* We'll parse numeric fields if they exist */}
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
            </p>
            <p className="text-lg">
  <strong className="text-gray-700">Total Employees:</strong>{" "}
  <span className="font-semibold text-black-600">
    {result?.["Total Employees"] ?? "N/A"}
  </span>
</p>
            <p className="text-lg">
              <strong className="text-gray-700">HCE Eligibility:</strong>{" "}
               {result["HCE Eligibility (%)"] ?? "N/A"}%
                </p>
                <p className="text-lg mt-2">
                <strong className="text-gray-700">NHCE Eligibility:</strong>{" "}
                {result["NHCE Eligibility (%)"] ?? "N/A"}%
                  </p>
                <p className="text-lg mt-2">
                <strong className="text-gray-700">Test Criterion:</strong>{" "}
                {result["Test Criterion"] ?? "N/A"}
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

          {/* If test fails, show corrective actions & consequences in the UI */}
          {result["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                   <li>Increase NHCE participation to ensure at least 70% of the HCE participation rate.</li>
                  <br />
                  <li>Adjust plan eligibility criteria to include more NHCEs.</li>
                  <br />
                  <li>Modify plan structure or incentives to encourage NHCE participation.</li>
                  <br />
                  <li>Review plan design to ensure compliance with IRC § 410(b).</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ Plan may fail the Coverage Test, impacting its tax-qualified status.</li>
                  <br />
                  <li>❌ HCE contributions may be limited or refunded.</li>
                  <br />
                  <li>❌ IRS penalties and potential disqualification risks.</li>
                  <br />
                  <li>❌ Additional employer contributions may be required for NHCEs.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RatioPercentageTest;
