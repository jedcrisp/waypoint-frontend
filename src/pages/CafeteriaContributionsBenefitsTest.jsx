import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth"; // Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";

const CafeteriaContributionsBenefitsTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan Year dropdown
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Adjust your backend URL as needed
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
    accept: ".csv, .xlsx",
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // =========================
  // 2. Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    const csvTemplate = [
  ["Last Name", "First Name", "Employee ID", "Employer Contribution", "Employee Contribution", "Employer Contributions (Avg)", "Employee Contributions (Avg)", "Cafeteria Plan Benefits", "Total Benefits", "NHCE Average Benefit", "HCE Average Benefit", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date", "Part-Time / Seasonal", "Union Employee"],
  ["Last", "First", "001", 1500, 1000, 1450, 950, 500, 3000, 1400, 1600, "No", "1985-03-12", "2010-06-01", "Active", "No", "2011-01-01", "No", "No"],
  ["Last", "First", "002", 2000, 1200, 1450, 950, 600, 3800, 1400, 1600, "Yes", "1978-07-22", "2005-03-15", "Active", "No", "2006-01-01", "No", "No"],
  ["Last", "First", "003", 0, 0, 1450, 950, 0, 0, 1400, 1600, "No", "1990-11-05", "2022-01-01", "Active", "No", "2022-01-01", "No", "No"],
  ["Last", "First", "004", 1800, 900, 1450, 950, 400, 3100, 1400, 1600, "No", "1983-06-30", "2014-04-20", "Active", "No", "2015-01-01", "No", "No"],
  ["Last", "First", "005", 1000, 500, 1450, 950, 200, 1700, 1400, 1600, "No", "1995-10-10", "2020-08-10", "Terminated", "Yes", "2021-01-01", "No", "No"],
  ["Last", "First", "006", 2200, 1300, 1450, 950, 700, 4200, 1400, 1600, "Yes", "1982-02-14", "2009-11-11", "Active", "No", "2010-01-01", "No", "No"],
  ["Last", "First", "007", 0, 0, 1450, 950, 0, 0, 1400, 1600, "No", "2000-05-05", "2023-05-01", "Active", "No", "2023-07-01", "Yes", "No"],
  ["Last", "First", "008", 1900, 1100, 1450, 950, 550, 3550, 1400, 1600, "Yes", "1979-09-18", "2006-02-20", "Active", "No", "2007-01-01", "No", "No"],
  ["Last", "First", "009", 1600, 800, 1450, 950, 450, 2850, 1400, 1600, "No", "1993-12-25", "2017-08-01", "Leave", "No", "2018-01-01", "No", "No"],
  ["Last", "First", "010", 1200, 700, 1450, 950, 300, 2200, 1400, 1600, "No", "2001-01-12", "2022-02-01", "Active", "No", "2023-01-01", "No", "No"]
]



      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Cafeteria_Contributions_Benefits_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 3. Upload File to Backend
  // =========================
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }
    if (!planYear) {
      setError("❌ Please select a plan year.");
      return;
    }

    // Validate file type
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
    formData.append("selected_tests", "cafeteria_contributions_benefits"); // Adjust if needed
    formData.append("plan_year", planYear); // Include plan year

    try {
      console.log("🚀 Uploading file to:", `${API_URL}/upload-csv/cafeteria_contributions_benefits`);

      // 1. Get Firebase token
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      // 2. Send POST request
      const response = await axios.post(
        `${API_URL}/upload-csv/cafeteria_contributions_benefits`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["cafeteria_contributions_benefits"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError(
        err.response?.data?.error ||
          "❌ Failed to upload file. Please check the format and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 4. Export PDF
  // =========================
  const exportToPDF = () => {
  if (!result) {
    setError("❌ No results available to export.");
    return;
  }

    const pdf = new jsPDF("p", "mm", "a4"); // <-- ✅ This is what's missing

    pdf.setFont("helvetica", "normal");

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Cafeteria Contributions & Benefits Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

    // Collect data
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const employerAvg = formatCurrency(result["Employer Contributions (Avg)"]);
    const employeeAvg = formatCurrency(result["Employee Contributions (Avg)"]);
    const hceAverageBenefit = formatCurrency(result["HCE Average Benefit"]);
    const nhceAverageBenefit = formatCurrency(result["NHCE Average Benefit"]);
    const totalBenefits = formatCurrency(result["Total Benefits"]);
    const testResult = result["Test Result"] ?? "N/A";
    const failed = testResult.toLowerCase() === "failed";
    const hceNhceRatio = result["HCE NHCE Ratio"] ?? "N/A"; // Optional, if needed
    const totalContributions = formatCurrency(result["Total Contributions"]);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60); // Gray text
    pdf.text(
  "Test Criterion: HCE average benefits must not exceed 125% of NHCE average benefits",
  105,
  38,
  { align: "center", maxWidth: 180 }
);

    // Table
    pdf.autoTable({
      startY: 45,
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", totalEmployees],
        ["Total Participants", totalParticipants],
        ["Total Contributions", totalContributions],
        ["Total Benefits", totalBenefits],
        ["Employer Contributions (Avg)", employerAvg],
        ["Employee Contributions (Avg)", employeeAvg],
        ["HCE Average Benefit", hceAverageBenefit],
        ["NHCE Average Benefit", nhceAverageBenefit],
        ["HCE NHCE Ratio", hceNhceRatio],
        ["Test Result", testResult],
      ],
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 12,
      font: "helvetica",
      lineColor: [150, 150, 150],  // Medium gray
      lineWidth: 0.2         // Thicker grid lines
    },
    margin: { left: 10, right: 10 },
  });

    // Corrective actions & consequences (only if failed)
  if (failed) {
    const correctiveActions = [
        "Review allocation of contributions between employer and employees",
        "Adjust plan design to promote equitable contributions",
        "Reevaluate plan terms to align with non-discrimination requirements",
    ];

    const consequences = [
        "Benefits may be reclassified as taxable for HCEs",
        "Additional employer contributions might be required",
        "Increased risk of IRS penalties and audits",
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

    // Footer
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

    pdf.save("Cafeteria_Contributions_Benefits_Results.pdf");
  };

  // =========================
  // 5. Download Results as CSV
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    // Collect data
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const employerAvg = formatCurrency(result["Employer Contributions (Avg)"]);
    const employeeAvg = formatCurrency(result["Employee Contributions (Avg)"]);
    const hceAverageBenefit = formatCurrency(result["HCE Average Benefit"]);
    const nhceAverageBenefit = formatCurrency(result["NHCE Average Benefit"]);
    const totalBenefits = formatCurrency(result["Total Benefits"]);
    const testResult = result["Test Result"] ?? "N/A";
    const failed = testResult.toLowerCase() === "failed";
    const hceNhceRatio = result["HCE NHCE Ratio"] ?? "N/A"; // Optional, if needed
    const totalContributions = formatCurrency(result["Total Contributions"]);

    const csvRows = [
        ["Total Employees", totalEmployees],
        ["Total Participants", totalParticipants],
        ["Total Contributions", totalContrib],
        ["Total Benefits", totalBenefits],
        ["Employer Contributions (Avg)", employerAvg],
        ["Employee Contributions (Avg)", employeeAvg],
        ["HCE Average Benefit", hceAverageBenefit],
        ["NHCE Average Benefit", nhceAverageBenefit],
        ["HCE NHCE Ratio", hceNhceRatio],
        ["Test Result", testResult],
    ];

    if (failed) {
      const correctiveActions = [
        "Review the allocation of contributions between employer and employees.",
        "Adjust plan benefit design to promote equitable contributions.",
        "Reevaluate plan terms to align with non-discrimination requirements.",
      ];
      const consequences = [
        "Benefits may be reclassified as taxable for HCEs.",
        "Additional employer contributions might be required.",
        "Increased risk of IRS penalties and audits.",
      ];
      csvRows.push([], ["Corrective Actions"], ...correctiveActions.map(a => ["", a]));
      csvRows.push([], ["Consequences"], ...consequences.map(c => ["", c]));
    }

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Cafeteria_Contributions_Benefits_Results.csv");
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
// --- 7. Render ---
return (
  <div
    className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
    onKeyDown={handleKeyDown}
    tabIndex="0"
  >
    <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
      📂 Upload Cafeteria Contributions & Benefits File
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
        !file || !planYear ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
      }`}
      disabled={!file || !planYear || loading}
    >
      {loading ? "Uploading..." : "Upload"}
    </button>

    {/* Display Errors */}
    {error && <div className="mt-3 text-red-500">{error}</div>}

    {/* Display Results */}
    {result && (
      <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-md">
        <h3 className="font-bold text-xl text-gray-700">
          Cafeteria Contributions & Benefits Test Results
        </h3>

        <div className="mt-4">
          <p className="text-lg">
            <strong className="text-gray-700">Plan Year:</strong>{" "}
            <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
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
            <strong className="text-gray-700">Employer Contributions (Avg):</strong>{" "}
            <span className="font-semibold text-black-600">
              {formatCurrency(result?.["Employer Contributions (Avg)"]) || "N/A"}
            </span>
          </p>

          <p className="text-lg mt-2">
            <strong className="text-gray-700">Employee Contributions (Avg):</strong>{" "}
            <span className="font-semibold text-black-600">
              {formatCurrency(result?.["Employee Contributions (Avg)"]) || "N/A"}
            </span>
          </p>

          <p className="text-lg mt-2">
            <strong className="text-gray-700">HCE Average Benefit:</strong>{" "}
            <span className="font-semibold text-black-600">
              {formatCurrency(result?.["HCE Average Benefit"]) || "N/A"}
            </span>
          </p>

          <p className="text-lg mt-2">
            <strong className="text-gray-700">NHCE Average Benefit:</strong>{" "}
            <span className="font-semibold text-black-600">
              {formatCurrency(result?.["NHCE Average Benefit"]) || "N/A"}
            </span>
          </p>

          <p className="text-lg mt-2">
            <strong className="text-gray-700">HCE/NHCE Ratio:</strong>{" "}
            <span className="font-semibold text-black-600">
              {result?.["HCE/NHCE Ratio"] ?? "N/A"}
            </span>
          </p>

          <p className="text-lg mt-2">
            <strong className="text-gray-700">Total Contributions:</strong>{" "}
            <span className="font-semibold text-black-600">
              {formatCurrency(result?.["Total Contributions"]) || "N/A"}
            </span>
          </p>

          <p className="text-lg mt-2">
            <strong className="text-gray-700">Total Benefits:</strong>{" "}
            <span className="font-semibold text-black-600">
              {formatCurrency(result?.["Total Benefits"]) || "N/A"}
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

        {/* Corrective Actions & Consequences if Test Failed */}
        {result?.["Test Result"]?.toLowerCase() === "failed" && (
          <>
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
              <h4 className="font-bold text-black-600">Corrective Actions:</h4>
              <ul className="list-disc list-inside text-black-600">
                <li>Review the allocation of contributions between the employer and employees.</li>
                <br />
                <li>Adjust plan benefit design to promote equitable contributions.</li>
                <br />
                <li>Reevaluate plan terms to align with non-discrimination requirements.</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
              <h4 className="font-bold text-black-600">Consequences:</h4>
              <ul className="list-disc list-inside text-black-600">
                <li>❌ Benefits may be reclassified as taxable for highly compensated employees.</li>
                <br />
                <li>❌ Additional employer contributions might be required.</li>
                <br />
                <li>❌ Increased risk of IRS penalties and audits.</li>
              </ul>
            </div>
          </>
        )}
      </div>
    )}
  </div>
);

}

export default CafeteriaContributionsBenefitsTest;
