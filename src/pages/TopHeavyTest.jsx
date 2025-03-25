import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable"; // For table generation

const TopHeavyTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year state

  const API_URL = import.meta.env.VITE_BACKEND_URL;

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
    formData.append("selected_tests", "top_heavy");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/top_heavy`);
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
      const response = await axios.post(`${API_URL}/upload-csv/top_heavy`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["top_heavy"] || {});
      } catch (err) {
        // Safely extract error from response if available
        const backendError = err.response?.data?.["Test Results"]?.["top_heavy"]?.error;

        if (backendError) {
          setError(backendError);
          return;
      }

      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.error || "❌ Failed to upload file. Please check the format and try again.");
      } finally {
        setLoading(false);
      }
    }; // Add this closing brace to properly close the handleUpload function


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
  ["Last", "First", "E001", "125000", "Yes", "10", "No", "1980-05-12", "2015-03-01", "No", "Active"],
  ["Last", "First", "E002", "10000", "No", "0", "No", "1995-07-20", "2020-06-15", "No", "Active"],
  ["Last", "First", "E003", "15000", "No", "0", "No", "1988-11-03", "2018-01-10", "No", "Active"],
  ["Last", "First", "E004", "30000", "Yes", "5", "No", "1979-02-28", "2010-09-23", "No", "Active"],
  ["Last", "First", "E005", "5000", "No", "0", "No", "1990-12-11", "2016-04-19", "No", "Active"],
  ["Last", "First", "E006", "20000", "No", "0", "No", "1992-03-05", "2014-08-30", "No", "Active"],
  ["Last", "First", "E007", "60000", "Yes", "15", "No", "1985-06-17", "2008-11-11", "No", "Active"],
  ["Last", "First", "E008", "8000", "No", "0", "No", "1991-09-30", "2017-07-22", "No", "Active"],
  ["Last", "First", "E009", "12000", "No", "0", "No", "1983-01-26", "2012-10-05", "No", "Active"],
  ["Last", "First", "E010", "7000", "No", "0", "Yes", "1987-04-14", "2011-12-17", "No", "Active"]
];

      csvTemplate.map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvTemplate.map(row => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Top_Heavy_Template.csv");
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
    const totalEmployees = result["Total Employees"] ?? "N/A"; // Added for completeness
    const totalAssets = result["Total Plan Assets"] ?? "N/A";
    const keyEmployeeAssets = result["Key Employee Assets"] ?? "N/A";
    const topHeavyPct = result["Top Heavy Percentage (%)"] ?? "N/A";
    const testRes = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Total Employees", totalEmployees],
      ["Plan Year", plan],
      ["Total Plan Assets", totalAssets],
      ["Key Employee Assets", keyEmployeeAssets],
      ["Top Heavy Percentage (%)", topHeavyPct],
      ["Test Result", testRes],
    ];

    if (testRes.toLowerCase() === "failed") {
      const correctiveActions = [
        "Ensure key employees hold no more than 60% of total plan assets.",
        "Provide additional employer contributions for non-key employees.",
        "Review and adjust contribution allocations to comply with IRS § 416.",
      ];
      const consequences = [
        "Mandatory employer contributions (3% of pay) for non-key employees.",
        "Potential loss of plan tax advantages.",
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

  // ----- 6. Export to PDF (ACP-style layout for Top Heavy Test) -----
  const formatCurrency = (amount) => {
    if (amount === "N/A") return "N/A"; // Handle missing values
    return `$${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (percent) => {
    if (percent === "N/A") return "N/A";
    return `${parseFloat(percent).toFixed(2)}%`;
};
  
  const exportToPDF = () => {
  if (!result) {
    setError("❌ No results available to export.");
    return;
  }

  const plan = planYear || "N/A";
  const totalEmployees = result["Total Employees"] ?? "N/A"; // Added for completeness
  const totalAssets = result["Total Plan Assets"] ?? "N/A";
  const keyEmployeeAssets = result["Key Employee Assets"] ?? "N/A";
  const topHeavyPct = result["Top Heavy Percentage (%)"] ?? "N/A";
  const testResult = result["Test Result"] ?? "N/A";

  const failed = testResult.toLowerCase() === "failed"; // Define `failed` here

  const pdf = new jsPDF("p", "mm", "a4");
  pdf.setFont("helvetica", "normal");

  // Header
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("Top Heavy Test Results", 105, 15, { align: "center" });
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
      ["Total Plan Assets", formatCurrency(totalAssets)],
      ["Key Employee Assets", formatCurrency(keyEmployeeAssets)],
      ["Top Heavy Percentage (%)", formatPercentage(topHeavyPct)],
      ["Test Result", testResult],
    ],
      headStyles: {
        fillColor: [41, 128, 185], // A blue header
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

  if (failed) {
    // Section 3: If Failed, add Corrective Actions & Consequences
    pdf.setFillColor(255, 230, 230); // Light red background
    pdf.setDrawColor(255, 0, 0); // Red border
    const correctiveBoxHeight = 35;
    pdf.rect(10, summaryStartY, 190, correctiveBoxHeight, "FD"); // Fill & Draw

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(255, 0, 0);
    pdf.text("Corrective Actions", 15, summaryStartY + 10);

    // Bullet Points
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    let bulletY = summaryStartY + 14;
    const lineHeight = 5;

    const correctiveActions = [
      "Ensure key employees hold no more than 60% of total plan assets.",
      "Provide additional employer contributions for non-key employees.",
      "Review and adjust contribution allocations per IRS § 416.",
    ];

    correctiveActions.forEach((action) => {
      pdf.text(`• ${action}`, 15, bulletY);
      bulletY += lineHeight;
    });

    // Consequences Box
    const nextBoxY = summaryStartY + correctiveBoxHeight + 5;
    pdf.setFillColor(255, 255, 204); // Light yellow background
    pdf.setDrawColor(255, 204, 0); // Gold border
    pdf.rect(10, nextBoxY, 190, 40, "FD");

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(204, 153, 0); // Dark gold
    pdf.text("Consequences", 15, nextBoxY + 10);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    let bulletY2 = nextBoxY + 18;

    const consequences = [
      "Mandatory employer contributions (3% of pay) for non-key employees.",
      "Loss of plan tax advantages if not corrected.",
      "Increased IRS audit risk.",
      "Additional corrective contributions may be required.",
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
  pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

  pdf.save("Top_Heavy_Results.pdf");
};

  // ----- RENDER -----
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={(e) => handleKeyDown(e)}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload Top Heavy File
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
          <h3 className="font-bold text-xl text-gray-700">Top Heavy Test Results</h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {planYear || "N/A"}
              </span>
            </p>
            <p className="text-lg">
            <strong className="text-gray-700">Total Employees:</strong>{" "}
              <span className="font-semibold text-blue-600"></span>
              </p>
            <p className="text-lg">
          <strong className="text-gray-700">Total Plan Assets:</strong>{" "}
          ${Number(result["Total Plan Assets"]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>

          <p className="text-lg mt-2">
         <strong className="text-gray-700">Key Employee Assets:</strong>{" "}
         ${Number(result["Key Employee Assets"]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
            <p className="text-lg mt-2">
             <strong className="text-gray-700">Top Heavy Percentage:</strong>{" "}
             {result?.["Top Heavy Percentage (%)"] !== undefined
             ? `${result["Top Heavy Percentage (%)"]}%`
                                              : "N/A"}
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
                  <li>❌ Mandatory employer contributions (3% of pay) for non-key employees.</li>
                  <br />
                  <li>❌ Loss of plan tax advantages if not corrected.</li>
                  <br />
                  <li>❌ Increased IRS audit risk due to noncompliance.</li>
                  <br />
                  <li>❌ Additional corrective contributions may be required.</li>
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
