import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const DCAPContributionsTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan Year dropdown
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL; // Ensure correct backend URL

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

    // Validate file extension
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
    formData.append("selected_tests", "dcap_contributions");

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/upload-csv/dcap_contributions`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const dcapResults = response.data?.["Test Results"]?.["dcap_contributions"];
      if (!dcapResults) {
        setError("❌ No DCAP Contributions test results found in response.");
      } else {
        setResult(dcapResults);
      }
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
    const csvTemplate = [
  ["Last Name", "First Name", "Employee ID", "DCAP Contributions", "HCE", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"],
  ["Last", "First", "001", 2500, "No", "1980-05-10", "2010-06-01", "Active", "No", "2020-01-01", "No", "No"],
  ["Last", "First", "002", 3000, "Yes", "1975-08-15", "2008-03-10", "Active", "No", "2019-01-01", "No", "No"],
  ["Last", "First", "003", 0, "No", "1990-01-01", "2021-05-01", "Active", "No", "2022-01-01", "No", "No"],
  ["Last", "First", "004", 4000, "Yes", "1985-10-30", "2005-07-12", "Active", "No", "2020-01-01", "No", "No"],
  ["Last", "First", "005", 0, "No", "2000-12-01", "2022-08-20", "Terminated", "No", "2022-01-01", "No", "No"],
  ["Last", "First", "006", 3200, "Yes", "1992-05-14", "2018-11-11", "Active", "Yes", "2020-01-01", "No", "No"],
  ["Last", "First", "007", 2800, "No", "2002-01-05", "2023-09-10", "Active", "No", "2022-01-01", "No", "No"],
  ["Last", "First", "008", 0, "No", "1980-03-25", "2015-11-01", "Active", "No", "2020-01-01", "No", "No"],
  ["Last", "First", "009", 3500, "Yes", "1982-06-22", "2011-07-07", "Active", "No", "2020-01-01", "No", "No"],
  ["Last", "First", "010", 0, "No", "2003-09-12", "2023-01-10", "Active", "No", "2022-01-01", "No", "No"],
]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "DCAP_Contributions_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 4. Export to PDF
  // =========================
  const exportToPDF = () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }

    // Example fields: HCE Average, NHCE Average, Test Result
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const hceAvg = result["HCE Average Contributions"] ?? "N/A";
    const nhceAvg = result["NHCE Average Contributions"] ?? "N/A";
    const percent125NHCEAvg = result["125% of NHCE Average"] ?? "N/A";
    const testRes = result["Test Result"] ?? "N/A";
    const failed = testRes.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60); // Gray text
    pdf.text(
      "Test Criterion: HCE average contributions must not exceed 125% of NHCE average",
      105,
      38,
      { align: "center", maxWidth: 180 }
    );

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("DCAP Contributions Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

    // Table
    pdf.autoTable({
    startY: 43,
    theme: "grid",
    head: [["Metric", "Value"]],
    body: [
        ["Total Employees", totalEmployees],
        ["Total Participants", totalParticipants],
        [
          "HCE Average Contributions",
          hceAvg !== "N/A" ? `$${Number(hceAvg).toLocaleString()}` : "N/A",
        ],
        [
          "NHCE Average Contributions",
          nhceAvg !== "N/A" ? `$${Number(nhceAvg).toLocaleString()}` : "N/A",
        ],
        ["125% of NHCE Average", percent125NHCEAvg !== "N/A" ? `$${(1.25 * Number(nhceAvg)).toLocaleString()}` : "N/A"],
        ["Test Result", testRes],
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
        "Limit contributions for HCEs to ensure compliance",
        "Increase matching for NHCEs",
        "Adjust plan design for balanced contributions",
    ];

    const consequences = [
        "HCE contributions become taxable income",
        "IRS penalties and possible plan disqualification",
        "Additional corrective contributions may be required",
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

    pdf.save("DCAP_Contributions_Results.pdf");
  };

  // =========================
  // 5. Download CSV Results
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const hceAvg = result["HCE Average Contributions"];
    const nhceAvg = result["NHCE Average Contributions"];
    const percent125NHCEAvg = result["125% of NHCE Average"] ?? "N/A";
    const testRes = result["Test Result"] ?? "N/A";
    const failed = testRes.toLowerCase() === "failed";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      ["Total Employees", totalEmployees],
      ["Total Participants", totalParticipants],
      [
        "HCE Average Contributions",
        hceAvg !== undefined ? `$${Number(hceAvg).toLocaleString()}` : "N/A",
      ],
      [
        "NHCE Average Contributions",
        nhceAvg !== undefined ? `$${Number(nhceAvg).toLocaleString()}` : "N/A",
      ],
      ["125% of NHCE Average", percent125NHCEAvg !== undefined ? `$${(1.25 * Number(nhceAvg)).toLocaleString()}` : "N/A"],
      ["Test Result", testRes],
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "DCAP_Contributions_Results.csv");
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
  // 7. Render
  // =========================
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload DCAP Contributions File
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

      {/* Choose File (Blue) */}
      <button
        type="button"
        onClick={open}
        className="mt-4 w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
      >
        Choose File
      </button>

      {/* Upload (Green if file selected, else Gray) */}
      <button
        onClick={handleUpload}
        className={`w-full mt-4 px-4 py-2 text-white rounded-md ${
          !file
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-400"
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
            DCAP Contributions Test Results
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
    {result?.["Total Employees"] !== undefined
      ? result["Total Employees"].toLocaleString()
      : "N/A"}
  </span>
</p>
<p className="text-lg mt-2">
  <strong className="text-gray-700">Total Participants:</strong>{" "}
  <span className="font-semibold text-black-600">
    {result?.["Total Participants"] !== undefined
      ? result["Total Participants"].toLocaleString()
      : "N/A"}
  </span>
</p>

            <p className="text-lg mt-2">
  <strong className="text-gray-700">HCE Average Contributions:</strong>{" "}
  <span className="font-semibold text-black-600">
    {formatCurrency(result?.["HCE Average Contributions"])}
  </span>
</p>
<p className="text-lg mt-2">
  <strong className="text-gray-700">NHCE Average Contributions:</strong>{" "}
  <span className="font-semibold text-black-600">
    {formatCurrency(result?.["NHCE Average Contributions"])}
  </span>
</p>
<p className="text-lg mt-2">
  <strong className="text-gray-700">125% of NHCE Average:</strong>{" "}
  <span className="font-semibold text-black-600">
    {formatCurrency(result?.["125% of NHCE Average"])}
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
                  <li>Limit contributions for HCEs to ensure compliance.</li>
                  <br />
                  <li>Increase matching for NHCEs.</li>
                  <br />
                  <li>Adjust plan design to balance contributions.</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>HCE contributions become taxable income.</li>
                  <br />
                  <li>IRS penalties and possible plan disqualification.</li>
                  <br />
                  <li>Additional corrective contributions may be required.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DCAPContributionsTest;
