import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import CsvTemplateDownloader from "../components/CsvTemplateDownloader"; // Adjust the path as needed
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";

const HealthFSAEligibilityTest = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Added Plan Year dropdown

  const API_URL = import.meta.env.VITE_BACKEND_URL; // Ensure this is correct

  // Formatting helpers
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "N/A";
    return `$${parseFloat(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    pdf.save("Health_FSA_Eligibility_Results.pdf");
  }

  const formatPercentage = (value) => {
    if (!value || isNaN(value)) return "N/A";
    return `${parseFloat(value).toFixed(2)}%`;
  };

  // Handle file selection via drag & drop
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

  // Handle file upload
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
    formData.append("selected_tests", "health_fsa_eligibility");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/health_fsa_eligibility`);
      console.log("📂 File Selected:", file.name);

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
        `${API_URL}/upload-csv/health_fsa_eligibility`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["health_fsa_eligibility"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger upload on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // CSV Template Download
  const downloadCSVTemplate = () => {
    const csvTemplate = [
  ["Last Name", "First Name", "Employee ID", "Eligible for FSA", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test", "Union Employee", "Part-Time / Seasonal", "Plan Entry Date"],
  ["Last", "First", "001", "Yes", "No", "1985-04-15", "2010-05-01", "Active", "No", "No", "No", "2011-01-01"],
  ["Last", "First", "002", "Yes", "Yes", "1979-06-22", "2005-07-15", "Active", "No", "No", "No", "2006-01-01"],
  ["Last", "First", "003", "No", "No", "1991-02-10", "2021-01-20", "Active", "No", "No", "No", "2022-01-01"],
  ["Last", "First", "004", "Yes", "Yes", "1980-11-12", "2008-04-25", "Active", "No", "No", "No", "2009-01-01"],
  ["Last", "First", "005", "No", "No", "2000-08-08", "2022-06-10", "Terminated", "No", "No", "No", "2023-01-01"],
  ["Last", "First", "006", "Yes", "Yes", "1983-09-30", "2012-03-05", "Active", "No", "No", "No", "2013-01-01"],
  ["Last", "First", "007", "Yes", "No", "2001-12-01", "2023-07-01", "Active", "No", "No", "Yes", "2023-08-01"],
  ["Last", "First", "008", "No", "Yes", "1977-05-05", "2001-09-01", "Leave", "No", "No", "No", "2002-01-01"],
  ["Last", "First", "009", "Yes", "No", "1996-03-17", "2018-10-01", "Active", "No", "No", "No", "2019-01-01"],
  ["Last", "First", "010", "No", "No", "2003-11-20", "2022-12-15", "Active", "No", "No", "No", "2023-01-01"]
]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Health_FSA_Eligibility_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Results Download (with corrective actions & consequences if failed)
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      ["Total Eligible Employees", result["Total Eligible Employees"] ?? "N/A"],
      ["Eligibility Percentage (%)", result["Eligibility Percentage (%)"] ? formatPercentage(result["Eligibility Percentage (%)"]) : "N/A"],
      ["Eligible for FSA", result["Eligible for FSA"] ?? "N/A"],
      ["Test Result", result["Health FSA Eligibility Test Result"] ?? "N/A"],
    ];

    if (result["Health FSA Eligibility Test Result"]?.toLowerCase() === "failed") {
      const correctiveActions = [
        "Expand eligibility for NHCEs.",
        "Increase NHCE participation through education and incentives.",
        "Adjust employer contributions to encourage NHCE participation.",
        "Amend the plan document to correct historical disparities.",
      ];
      const consequences = [
        "Taxation of FSA benefits for HCEs.",
        "IRS penalties and fines.",
        "Risk of plan disqualification.",
        "Retroactive correction requirements.",
      ];
      csvRows.push([], ["Corrective Actions"], ...correctiveActions.map(action => ["", action]));
      csvRows.push([], ["Consequences"], ...consequences.map(item => ["", item]));
    }

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Health_FSA_Eligibility_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

  const failed = result["Test Result"]?.toLowerCase() === "failed";
  const totalEligibleEmployees = result["Total Eligible Employees"] ?? "N/A";
  const eligibleforFSA = result["Eligible for FSA"] ?? "N/A";
  const eligibilityPercentage = result["Eligibility Percentage (%)"] ?? 0;
  const pdf = new jsPDF("p", "mm", "a4");
  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("Health FSA Eligibility Test Results", 105, 15, { align: "center" });

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

  pdf.autoTable({
    startY: 40,
    theme: "grid",
    head: [["Metric", "Value"]],
    body: [
      ["Total Employees", totalEligibleEmployees],
      ["Eligible for FSA", eligibleforFSA],
      ["Eligibility Percentage (%)", formatPercentage(eligibilityPercentage)],
      ["Test Result", result["Test Result"] ?? "N/A"],
    ],
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    styles: { fontSize: 12, font: "helvetica" },
    margin: { left: 10, right: 10 },
  });
pdf.save("Health_FSA_Eligibility_Results.pdf");

// Corrective actions & consequences (only if failed)
if (failed) {
  const correctiveActions = [
    "Expand eligibility for NHCEs",
    "Increase NHCE participation through education and incentives",
    "Adjust employer contributions to encourage NHCE participation",
    "Amend the plan document to correct historical disparities",
  ];

    const consequences = [
        "Taxation of FSA benefits for HCEs",
        "IRS penalties and fines",
        "Risk of plan disqualification",
        "Retroactive correction requirements",
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
    pdf.save("Health_FSA_Eligibility_Results.pdf");
  };

  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload Health FSA Eligibility File
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

      {/* Dedicated "Choose File" Button */}
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
            Health FSA Eligibility Test Results
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
              <span className="font-semibold text-black-600">
                {result?.["Total Eligible Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Eligible for FSA:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Eligible for FSA"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
  <strong className="text-gray-700">Eligibility Percentage:</strong>{" "}
  <span className="font-semibold text-gray-800">
    {result?.["Eligibility Percentage (%)"]
      ? formatPercentage(result["Eligibility Percentage (%)"])
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
                {result?.["Test Result"] ?? "N/A"}
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

          {result?.["Health FSA Eligibility Test Result"] === "Failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Expand eligibility for NHCEs.</li>
                  <br />
                  <li>Increase NHCE participation through education and incentives.</li>
                   <br />
                  <li>Adjust employer contributions to encourage NHCE participation.</li>
                   <br />
                  <li>Amend the plan document to correct historical disparities.</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>❌ Taxation of FSA benefits for HCEs.</li>
                   <br />
                  <li>❌ IRS penalties and fines.</li>
                   <br />
                  <li>❌ Risk of plan disqualification.</li>
                   <br />
                  <li>❌ Retroactive correction requirements.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthFSAEligibilityTest;
