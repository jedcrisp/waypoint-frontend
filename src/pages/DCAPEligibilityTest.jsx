import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const DCAPEligibilityTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState("");

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // ---------- Formatting Helpers ----------
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

  // ---------- Drag & Drop Logic ----------
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

  // ---------- Upload File to Backend ----------
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }

    // Validate file extension
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
    formData.append("selected_tests", "dcap_eligibility");

    try {
      console.log("Uploading file to API:", `${API_URL}/upload-csv/dcap_eligibility`);
      console.log("File Selected:", file.name);

      // 1. Get Firebase token
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      // 2. Send POST request with Bearer token
      const response = await axios.post(`${API_URL}/upload-csv/dcap_eligibility`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("API Response:", response.data);
      setResult(response.data["Test Results"]["dcap_eligibility"]);
    } catch (err) {
      console.error("Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Download CSV Template ----------
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "HCE",
        "Eligible for DCAP",
        "DOB",
        "DOH",
        "Employment Status",
        "Excluded from Test",
        "Union Employee",
        "Part-Time / Seasonal",
        "Plan Entry Date",
      ],
      ["Last", "First", "001", "Yes", "Yes", "1980-05-10", "2010-06-01", "Active", "No", "No", "No", "2011-01-01"],
      ["Last", "First", "002", "No", "Yes", "1985-08-15", "2012-03-10", "Active", "No", "No", "No", "2013-01-01"],
      ["Last", "First", "003", "Yes", "No", "1975-01-20", "2005-05-05", "Active", "No", "No", "No", "2006-01-01"],
      ["Last", "First", "004", "No", "Yes", "1990-12-01", "2020-08-20", "Active", "No", "Yes", "No", "2021-01-01"],
      ["Last", "First", "005", "No", "No", "1995-07-19", "2021-04-10", "Leave", "Yes", "No", "Yes", "2022-01-01"],
      ["Last", "First", "006", "Yes", "Yes", "1982-11-03", "2009-11-01", "Active", "No", "No", "No", "2010-01-01"],
      ["Last", "First", "007", "No", "Yes", "2001-04-25", "2022-09-15", "Active", "No", "No", "No", "2023-01-01"],
      ["Last", "First", "008", "Yes", "No", "1978-02-14", "2000-01-01", "Terminated", "No", "No", "Yes", "2001-01-01"],
      ["Last", "First", "009", "No", "Yes", "1999-06-30", "2019-03-05", "Active", "No", "No", "No", "2020-01-01"],
      ["Last", "First", "010", "No", "No", "2003-09-12", "2023-01-10", "Active", "No", "No", "No", "2023-07-01"],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "DCAP_Eligibility_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------- Download Results as CSV (with corrective actions & consequences if failed) ----------
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    const totalEligibleEmployees = result["Total Eligible Employees"] ?? "N/A";
    const eligibleEmployees = result["Eligible Employees"] ?? "N/A";
    const dcapEligibilityPercentage = result["DCAP Eligibility Percentage (%)"] ?? "N/A";
    const testRes = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Total Eligible Employees", totalEligibleEmployees],
      ["Eligible Employees", eligibleEmployees],
      ["DCAP Eligibility Percentage (%)", dcapEligibilityPercentage],
      ["Test Result", testRes],
    ];

    const failed = testRes.toLowerCase() === "failed";
    if (failed) {
      const correctiveActions = [
        "Expand Eligibility for NHCEs: Remove restrictive criteria that exclude NHCEs from participating in DCAP.",
        "Increase NHCE Participation: Improve education and awareness, offer enrollment incentives, and simplify the sign-up process.",
        "Adjust Employer Contributions: Ensure employer contributions are evenly distributed among HCEs and NHCEs.",
        "Amend the Plan Document: Modify eligibility and contribution rules to align with IRS nondiscrimination requirements.",
      ];
      const consequences = [
        "Potential IRS penalties or plan disqualification.",
        "Potential disqualification of the Health FSA plan.",
        "Loss of tax-free DCAP benefits for employees.",
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
    link.setAttribute("download", "DCAP_Eligibility_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------- Export Results to PDF (Including Consequences) ----------
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    const totalEligibleEmployees = result["Total Eligible Employees"] ?? "N/A";
    const eligibleEmployees = result["Eligible Employees"] ?? "N/A";
    const dcapEligibilityPercentage = result["DCAP Eligibility Percentage (%)"] ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";
    const failed = testResult.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");

    // Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("DCAP Eligibility Test Results", 105, 15, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`Plan Year: ${planYear || "N/A"}`, 105, 25, { align: "center" });
    const generatedTimestamp = new Date().toLocaleString();
   pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

    // Results Table
    pdf.autoTable({
      startY: 40,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", totalEligibleEmployees],
        ["Eligible Employees", eligibleEmployees],
        ["DCAP Eligibility Percentage", formatPercentage(dcapEligibilityPercentage)],
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

    const nextY = pdf.lastAutoTable.finalY + 10;

     // Corrective actions & consequences (only if failed)
  if (failed) {
    const correctiveActions = [
       "Expand Eligibility for NHCEs: Remove restrictive criteria that exclude NHCEs from participating in DCAP.",
        "Increase NHCE Participation: Improve education and awareness, offer enrollment incentives, and simplify the sign-up process.",
        "Adjust Employer Contributions: Ensure employer contributions are evenly distributed among HCEs and NHCEs.",
        "Amend the Plan Document: Modify eligibility and contribution rules to align with IRS nondiscrimination requirements.",
      ];

    const consequences = [
        "Potential IRS penalties or plan disqualification.",
        "Potential disqualification of the Health FSA plan.",
        "Loss of tax-free DCAP benefits for employees."
    ];

    pdf.autoTable({
      startY: pdf.lastAutoTable.finalY + 10,
      theme: "grid",
      head: [["Corrective Actions"]],
      body: correctiveActions.map(action => [action]),
      headStyles: { fillColor: [255, 0, 0], textColor: [255, 255, 255] },
      styles: { fontSize: 11, font: "helvetica" },
      margin: { left: 10, right: 10 },
    });

    pdf.autoTable({
      startY: pdf.lastAutoTable.finalY + 10,
      theme: "grid",
      head: [["Consequences"]],
      body: consequences.map(consequence => [consequence]),
      headStyles: { fillColor: [238, 220, 92], textColor: [255, 255, 255] },
      styles: { fontSize: 11, font: "helvetica" },
      margin: { left: 10, right: 10 },
    });
  }


    pdf.save("DCAP_Eligibility_Test_Results.pdf");
  };

  // ---------- Handle Enter Key ----------
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // ---------- RENDER ----------
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload DCAP Eligibility File
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
          isDragActive ? "border-green-500 bg-blue-100" : "border-gray-300 bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p className="text-green-600 font-semibold">{file.name}</p>
        ) : isDragActive ? (
          <p className="text-green-600">📂 Drop the file here...</p>
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
            DCAP Eligibility Test Results
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
              <span className="font-semibold text-black-800">
                {result?.["Total Eligible Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">
                DCAP Eligibility Percentage:
              </strong>{" "}
              <span className="font-semibold text-black-800">
                {formatPercentage(result?.["DCAP Eligibility Percentage (%)"])}
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

          {/* If failed, show corrective actions and consequences */}
          {result?.["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-gray-800">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-gray-800">
                  <li className="mt-2">
                    Expand Eligibility for NHCEs: Remove restrictive criteria that exclude NHCEs from participating in DCAP.
                  </li>
                  <li className="mt-2">
                    Increase NHCE Participation: Improve education and awareness, offer enrollment incentives, and simplify the sign-up process.
                  </li>
                  <li className="mt-2">
                    Adjust Employer Contributions: Ensure employer contributions are evenly distributed among HCEs and NHCEs.
                  </li>
                  <li className="mt-2">
                    Amend the Plan Document: Modify eligibility and contribution rules to align with IRS nondiscrimination requirements.
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-gray-800">Consequences:</h4>
                <ul className="list-disc list-inside text-gray-800">
                  <li className="mt-2">
                    ❌ Potential IRS penalties or plan disqualification.
                  </li>
                  <li className="mt-2">
                    ❌ Potential disqualification of the Health FSA plan.
                  </li>
                  <li className="mt-2">
                    ❌ Loss of tax-free DCAP benefits for employees.
                  </li>
                </ul>
              </div>
            </>
          )}

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

export default DCAPEligibilityTest;
