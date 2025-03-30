import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver";

const DCAP55BenefitsTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // ---------- Formatting Helpers ----------
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(Number(value)))
      return "N/A";
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(Number(value)))
      return "N/A";
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
    if (!planYear) {
      setError("❌ Please select a plan year.");
      return;
    }

    const validFileTypes = ["csv"];
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!validFileTypes.includes(fileType)) {
      setError("❌ Invalid file type. Please upload a CSV file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("selected_tests", "dcap_55_benefits");

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/upload-csv/dcap_55_benefits`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const dcapResults = response.data?.["Test Results"]?.["dcap_55_benefits"];
      if (!dcapResults) {
        setError("❌ No DCAP 55% Benefits test results found in response.");
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
      ["Last Name", "First Name", "Employee ID", "HCE", "DCAP Benefits", "DOB", "DOH", "Employment Status", "Excluded from Test", "Plan Entry Date", "Union Employee", "Part-Time / Seasonal"],
      ["Last", "First", "E001", "No", "2500", "1988-04-12", "2015-06-01", "Active", "No", "2016-01-01", "No", "No"],
      ["Last", "First", "E002", "Yes", "3200", "1975-11-03", "2010-03-15", "Active", "No", "2011-01-01", "No", "No"],
      ["Last", "First", "E003", "No", "1800", "1992-01-01", "2020-09-10", "Active", "No", "2021-01-01", "No", "No"],
      ["Last", "First", "E004", "Yes", "4000", "1980-08-25", "2012-07-01", "Active", "No", "2013-01-01", "No", "No"],
      ["Last", "First", "E005", "No", "1500", "1995-05-18", "2018-05-01", "Active", "No", "2019-01-01", "Yes", "No"],
      ["Last", "First", "E006", "Yes", "3500", "1983-12-09", "2011-01-10", "Active", "No", "2012-01-01", "No", "No"],
      ["Last", "First", "E007", "No", "2000", "1990-07-14", "2021-04-01", "Terminated", "No", "2021-07-01", "No", "Yes"],
      ["Last", "First", "E008", "Yes", "3600", "1978-10-20", "2008-02-20", "Active", "No", "2009-01-01", "No", "No"],
      ["Last", "First", "E009", "No", "0", "2001-09-01", "2023-01-01", "Active", "No", "2023-02-01", "No", "No"],
      ["Last", "First", "E010", "No", "1700", "1994-06-30", "2016-06-01", "Leave", "No", "2017-01-01", "No", "Yes"]
    ];
    const csvContent = csvTemplate.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "DCAP_55_Benefits_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 4. Export Results to PDF (with Firebase saving)
  // =========================
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const hceAvg = result["HCE Avg Benefits"] ?? "N/A";
    const nhceAvg = result["Non-HCE Avg Benefits"] ?? "N/A";
    const benefitRatio = result["Benefit Ratio (%)"] ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";
    const failed = testResult.toLowerCase() === "failed";

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.setFont("helvetica", "normal");

    // Subheader with test criterion
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    pdf.text(
      "Test Criterion: Non-HCEs must receive greater than or equal to 55% of average HCE benefits",
      105,
      40,
      { align: "center", maxWidth: 170 }
    );

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("DCAP 55% Benefits Test Results", 105, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: "center" });

    // Results Table
    pdf.autoTable({
      startY: 48,
      theme: "grid",
      head: [["Metric", "Value"]],
      body: [
        [
          "Total Employees",
          totalEmployees !== "N/A" ? Number(totalEmployees).toLocaleString("en-US") : "N/A"
        ],
        [
          "Total Participants",
          totalParticipants !== "N/A" ? Number(totalParticipants).toLocaleString("en-US") : "N/A"
        ],
        [
          "HCE Avg Benefits",
          hceAvg !== "N/A"
            ? Number(hceAvg).toLocaleString("en-US", { style: "currency", currency: "USD" })
            : "N/A"
        ],
        [
          "Non-HCE Avg Benefits",
          nhceAvg !== "N/A"
            ? Number(nhceAvg).toLocaleString("en-US", { style: "currency", currency: "USD" })
            : "N/A"
        ],
        [
          "Benefit Ratio (%)",
          benefitRatio !== "N/A" ? `${benefitRatio}%` : "N/A"
        ],
        ["Test Result", testResult],
      ],
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 12,
        font: "helvetica",
        lineColor: [150, 150, 150],
        lineWidth: 0.2,
      },
      margin: { left: 10, right: 10 },
    });

    // Add corrective actions & consequences if test failed
    if (failed) {
      const correctiveActions = [
        "Reduce DCAP Benefits for owners/HCEs to bring them under 55% threshold",
        "Increase NHCE participation or benefits",
        "Redistribute employer contributions to balance the ratio",
      ];

      const consequences = [
        "HCE DCAP benefits become taxable",
        "IRS penalties and potential plan disqualification",
        "Loss of tax-free DCAP benefits for employees",
      ];

      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 10,
        theme: "grid",
        head: [["Corrective Actions"]],
        body: correctiveActions.map((action) => [action]),
        headStyles: { fillColor: [255, 0, 0], textColor: [255, 255, 255] },
        styles: { fontSize: 11, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });

      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 10,
        theme: "grid",
        head: [["Consequences"]],
        body: consequences.map((consequence) => [consequence]),
        headStyles: { fillColor: [238, 220, 92], textColor: [255, 255, 255] },
        styles: { fontSize: 11, font: "helvetica" },
        margin: { left: 10, right: 10 },
      });
    }

    // Footer
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

    // Output PDF as a blob and save locally
    let pdfBlob;
    try {
      pdfBlob = pdf.output("blob");
      pdf.save("DCAP_55_Benefits_Results.pdf");
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }

    // Save PDF to Firebase using the helper function
    try {
      await savePdfResultToFirebase({
        fileName: "DCAP 55% Benefits Test",
        pdfBlob,
        additionalData: {
          planYear,
          testResult: testResult || "Unknown",
        },
      });
    } catch (error) {
      setError(`❌ Error saving PDF to Firebase: ${error.message}`);
    }
  };

  // =========================
  // 6. Download Results as CSV
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const hceAvg = result["HCE Avg Benefits"] ?? "N/A";
    const nhceAvg = result["Non-HCE Avg Benefits"] ?? "N/A";
    const benefitRatio = result["Benefit Ratio (%)"] ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      [
        "Total Employees",
        totalEmployees !== "N/A"
          ? Number(totalEmployees).toLocaleString("en-US")
          : "N/A"
      ],
      [
        "Total Participants",
        totalParticipants !== "N/A"
          ? Number(totalParticipants).toLocaleString("en-US")
          : "N/A"
      ],
      [
        "HCE Avg Benefits",
        hceAvg !== "N/A"
          ? Number(hceAvg).toLocaleString("en-US", { style: "currency", currency: "USD" })
          : "N/A"
      ],
      [
        "Non-HCE Avg Benefits",
        nhceAvg !== "N/A"
          ? Number(nhceAvg).toLocaleString("en-US", { style: "currency", currency: "USD" })
          : "N/A"
      ],
      [
        "Benefit Ratio (%)",
        benefitRatio !== "N/A" ? `${benefitRatio}%` : "N/A"
      ],
      ["Test Result", testResult],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "DCAP_55_Benefits_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 7. Handle Enter Key
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
        📂 Upload DCAP 55% Benefits File
      </h2>

      {/* Plan Year Dropdown */}
      <div className="mb-6">
        <div className="flex items-center">
          {planYear === "" && (
            <span className="text-red-500 text-lg mr-2">*</span>
          )}
          <select
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
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-md">
          <h3 className="font-bold text-xl text-gray-700">DCAP 55% Benefits Test Results</h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Total Employees:</strong>{" "}
              <span className="font-semibold text-black">
                {result?.["Total Employees"] !== undefined
                  ? Number(result["Total Employees"]).toLocaleString("en-US")
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Total Participants:</strong>{" "}
              <span className="font-semibold text-black">
                {result?.["Total Participants"] !== undefined
                  ? Number(result["Total Participants"]).toLocaleString("en-US")
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">HCE Avg Benefits:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["HCE Avg Benefits"] !== undefined
                  ? Number(result["HCE Avg Benefits"]).toLocaleString("en-US", { style: "currency", currency: "USD" })
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Non-HCE Avg Benefits:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Non-HCE Avg Benefits"] !== undefined
                  ? Number(result["Non-HCE Avg Benefits"]).toLocaleString("en-US", { style: "currency", currency: "USD" })
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Benefit Ratio:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Benefit Ratio (%)"] !== undefined
                  ? formatPercentage(result["Benefit Ratio (%)"])
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

          {/* Corrective Actions & Consequences if Test Failed */}
          {result["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>
                    Adjust eligibility requirements to ensure NHCEs meet the 70% threshold.
                  </li>
                  <br />
                  <li>
                    Modify plan design to allow more NHCEs to participate.
                  </li>
                  <br />
                  <li>
                    Ensure compliance with the Ratio Percentage Test.
                  </li>
                  <br />
                  <li>
                    Review employee demographics to adjust contribution structures.
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Plan may lose tax-qualified status.</li>
                  <br />
                  <li>HCEs may have contributions refunded, reducing their tax benefits.</li>
                  <br />
                  <li>Additional corrective employer contributions may be required.</li>
                  <br />
                  <li>Increased IRS audit risk due to compliance failure.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DCAP55BenefitsTest;
