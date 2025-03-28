import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const CafeteriaKeyEmployeeTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan Year dropdown
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
    accept: ".csv",
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // =========================
  // 2. Upload File
  // =========================
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
    formData.append("selected_tests", "key_employee");

    try {
      console.log("🚀 Uploading file to:", `${API_URL}/upload-csv/key_employee`);
      console.log("📂 File Selected:", file.name);

      // 1. Get Firebase token
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      // 2. Send POST request
      const response = await axios.post(`${API_URL}/upload-csv/key_employee`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Response received:", response.data);

      const cafeteriaResults = response.data?.["Test Results"]?.["key_employee"];
      if (!cafeteriaResults) {
        setError("❌ No Cafeteria Key Employee test results found in response.");
      } else {
        setResult(cafeteriaResults);
      }
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 3. Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    const csvTemplate = [
  ["Last Name", "First Name", "Employee ID", "Compensation", "Cafeteria Plan Benefits", "Key Employee", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date", "Part-Time / Seasonal", "Union Employee"],
  ["Last", "First", "001", "85000", "4500", "Yes", "1980-06-15", "2010-04-01", "Active", "No", "2010-10-01", "No", "No"],
  ["Last", "First", "002", "72000", "3800", "No", "1985-09-23", "2015-07-15", "Active", "No", "2016-01-01", "No", "No"],
  ["Last", "First", "003", "69000", "3400", "No", "1990-01-11", "2017-03-12", "Active", "No", "2017-09-01", "No", "No"],
  ["Last", "First", "004", "98000", "5000", "Yes", "1975-11-02", "2008-06-20", "Active", "No", "2009-01-01", "No", "No"],
  ["Last", "First", "005", "56000", "2900", "No", "1993-03-30", "2020-08-10", "Active", "No", "2021-01-01", "No", "No"],
  ["Last", "First", "006", "47000", "2100", "No", "1999-07-19", "2022-05-22", "Active", "No", "2022-11-01", "Yes", "No"],
  ["Last", "First", "007", "52000", "2750", "No", "1991-04-04", "2019-10-05", "Terminated", "Yes", "2020-01-01", "No", "No"],
  ["Last", "First", "008", "60000", "3300", "Yes", "1988-12-10", "2013-02-18", "Active", "No", "2013-08-01", "No", "Yes"],
  ["Last", "First", "009", "45000", "2000", "No", "1997-05-27", "2023-04-15", "Active", "No", "2023-10-01", "Yes", "No"],
  ["Last", "First", "010", "77000", "4100", "Yes", "1982-08-08", "2011-11-01", "Active", "No", "2012-05-01", "No", "No"]
]

      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Cafeteria_Key_Employee_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 4. Export to PDF
  // =========================
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    const plan = planYear || "N/A";
    const totalEmployees = result?.["Total Employees"] ?? "N/A";
    const totalParticipants = result?.["Total Participants"] || "N/A";
    const keyEmployeeBenefits = result?.["Key Employee Benefits"] !== undefined
      ? formatCurrency(result["Key Employee Benefits"])
      : "N/A";
    const totalBenefits = result?.["Total Benefits"] !== undefined
      ? formatCurrency(result["Total Benefits"])
      : "N/A";
    const keyEmployeeBenefitPercentage = result["Key Employee Benefit Percentage"] !== undefined
      ? formatPercentage(result["Key Employee Benefit Percentage"])
      : "N/A";
    const testResult = result["Test Result"] || "N/A";
    const failed = testResult.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60);
    pdf.text(
      "Test Criterion: HCE average benefits must not exceed 125% of NHCE average benefits",
        105,
        40,
        { align: "center" }
      );

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Cafeteria Key Employee Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

    pdf.autoTable({
      startY: 47,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", totalEmployees],
        ["Total Participants", totalParticipants],
        ["Total Benefits", totalBenefits],
        ["Key Employee Benefits", keyEmployeeBenefits],
        ["Key Employee Benefit Percentage", keyEmployeeBenefitPercentage],
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

    // Corrective actions & consequences (only if failed)
  if (failed) {
    const correctiveActions = [
        "Reallocate Cafeteria Plan benefits to balance distributions",
        "Adjust classifications of key employees",
        "Review and update contribution policies",
    ];

    const consequences = [
        "Loss of Tax-Exempt Status for Key Employees",
        "IRS Scrutiny and Potential Penalties",
        "Risk of Plan Disqualification",
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
    })
   }

    // =========================
    // 4. Footer
    // =========================
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100); // Gray text
    pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);
    pdf.save("Cafeteria_Key_Employee_Results.pdf");
  };

  // =========================
// 5. Download Results as CSV
// =========================
const downloadResultsAsCSV = () => {
  if (!result) {
    setError("❌ No results to download.");
    return;
  }

  const testRes = result["Test Result"] ?? "N/A";
  const totalEmployees = result?.["Total Employees"] ?? "N/A";
  const totalParticipants = result?.["Total Participants"] ?? "N/A";
  const keyEmpBenefit = result?.["Key Employee Benefits"];
  const benefitPct = result["Key Employee Benefit Percentage"] !== undefined
    ? `${result["Key Employee Benefit Percentage"]}%`
    : "N/A";

  // Wrap values in quotes to prevent breaking on commas
  const csvRows = [
    ["Metric", "Value"],
    ["Plan Year", `"${planYear}"`],
    ["Total Employees", `"${totalEmployees}"`],
    ["Total Participants", `"${totalParticipants}"`],
    ["Key Employee Benefits", `"${formatCurrency(keyEmpBenefit)}"`],
    ["Key Employee Benefit Percentage", `"${benefitPct}"`],
    ["Test Result", `"${testRes}"`],
  ];

  const csvContent = csvRows.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "Cafeteria_Key_Employee_Results.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  // Render
  // =========================
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload Cafeteria Key Employee File
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
            Drag & drop a <strong>CSV</strong> here.
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

      {/* Choose File (Blue) */}
      <button
        type="button"
        onClick={open}
        className="mt-4 w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
      >
        Choose File
      </button>

      {/* Upload (Green if file, else Gray) */}
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
            Cafeteria Key Employee Test Results
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
             <p className="text-lg">
            <strong className="text-gray-700">Total Participants:</strong>{" "}
              <span className="font-semibold text-black-600">
               {result["Total Participants"] ?? "N/A"}
             </span>
            </p>
            <p className="text-lg">
            <strong className="text-gray-700">Total Benefits:</strong>{" "}
              <span className="font-semibold text-black-600">
               {formatCurrency(result?.["Total Benefits"] ?? "N/A")}
             </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Key Employee Benefit Percentage:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result["Key Employee Benefit Percentage"] !== undefined
                  ? result["Key Employee Benefit Percentage"] + "%"
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
            <strong className="text-gray-700">Key Employee Benefits:</strong>{" "}
              <span className="font-semibold text-black-600">
              {result?.["Key Employee Benefits"] !== undefined
              ? formatCurrency(result["Key Employee Benefits"])
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

            {/* Corrective Actions & Consequences if Failed */}
            {result["Test Result"]?.toLowerCase() === "failed" && (
              <>
                <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                  <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                  <ul className="list-disc list-inside text-black-600">
                    <li>Reallocate Cafeteria Plan benefits to balance distributions.</li>
                    <br />
                    <li>Adjust classifications of key employees.</li>
                    <br />
                    <li>Review and update contribution policies.</li>
                  </ul>
                </div>

                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                  <h4 className="font-bold text-black-600">Consequences:</h4>
                  <ul className="list-disc list-inside text-black-600">
                    <li>Loss of Tax-Exempt Status for Key Employees</li>
                    <br />
                    <li>IRS Scrutiny and Potential Penalties</li>
                    <br />
                    <li>Risk of Plan Disqualification for Non-Compliance</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
            )}
    </div>
  );
};

export default CafeteriaKeyEmployeeTest;
