import React, { useState, useCallback } from "react";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Use the external helper
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import jsPDF from "jspdf";
import "jspdf-autotable";

const DCAPOwnersTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL; // Ensure this is correct

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
  // 2. Upload File to Backend
  // =========================
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }
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
    formData.append("selected_tests", "dcap_owners");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/dcap_owners`);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/upload-csv/dcap_owners`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (
        response.data &&
        response.data["Test Results"] &&
        response.data["Test Results"]["dcap_owners"]
      ) {
        setResult(response.data["Test Results"]["dcap_owners"]);
      } else {
        setError("❌ Unexpected response structure. Please check the API response.");
      }
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 3. Handle Enter Key
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // =========================
  // 4. Download CSV Template
  // =========================
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "Ownership %",
        "DCAP Benefits",
        "DOB",
        "DOH",
        "Employment Status",
        "Excluded from Test",
        "Family Member",
        "Plan Entry Date",
        "Union Employee",
        "Part-Time / Seasonal",
      ],
      ["Last", "First", "001", "0", 2500, "1980-01-15", "2010-06-01", "Active", "No", "No", "2011-01-01", "No", "No"],
      ["Last", "First", "002", "10", 3200, "1975-09-23", "2005-03-10", "Active", "No", "No", "2006-01-01", "No", "No"],
      ["Last", "First", "003", "5", 0, "1990-03-12", "2021-07-15", "Active", "No", "No", "2022-01-01", "No", "No"],
      ["Last", "First", "004", "50", 4000, "1982-11-05", "2008-04-25", "Active", "No", "Yes", "2009-01-01", "No", "No"],
      ["Last", "First", "005", "0", 1800, "1995-06-18", "2019-09-30", "Terminated", "No", "No", "2020-01-01", "No", "No"],
      ["Last", "First", "006", "20", 3600, "1987-07-01", "2012-10-10", "Active", "No", "No", "2013-01-01", "No", "No"],
      ["Last", "First", "007", "0", 0, "2001-05-21", "2023-04-01", "Active", "No", "No", "2023-07-01", "No", "Yes"],
      ["Last", "First", "008", "30", 4100, "1979-08-29", "2006-12-20", "Active", "No", "Yes", "2007-01-01", "No", "No"],
      ["Last", "First", "009", "0", 2100, "1993-01-01", "2018-08-15", "Leave", "No", "No", "2019-01-01", "No", "No"],
      ["Last", "First", "010", "0", 1500, "2000-10-10", "2022-03-05", "Active", "No", "No", "2023-01-01", "No", "No"],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "DCAP Owners Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 5. Download Results as CSV
  // =========================
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", planYear],
      ["Total Employees", result["Total Employees"] ?? "N/A"],
      ["Total Participants", result["Total Participants"] ?? "N/A"],
      ["Average DCAP Benefit for Owners", result["Average DCAP Benefit for Owners"] ?? "N/A"],
      [
        "Percentage of Benefits to Owners",
        result["Percentage of Benefits to Owners"]
          ? result["Percentage of Benefits to Owners"] + "%"
          : "N/A",
      ],
      ["Test Result", result["Test Result"] ?? "N/A"],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "DCAP Owners Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // 6. Export to PDF with Firebase Save
  // =========================
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    let pdfBlob;
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      // Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("DCAP Owners Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
      const generatedTimestamp = new Date().toLocaleString();
      pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        "Test Criterion: Under IRC §129(c), no more than 25% of total DCAP benefits may be provided to shareholders or owners who hold more than 5% of the company.",
        105,
        38,
        { align: "center", maxWidth: 180 }
      );

      // Table with Results
      pdf.autoTable({
        startY: 48,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", result["Total Employees"] ?? "N/A"],
          ["Total Participants", result["Total Participants"] ?? "N/A"],
          [
            "Average DCAP Benefit for Owners (Formatted)",
            formatCurrency(result["Average DCAP Benefit for Owners"])
          ],
          [
            "Percentage of Benefits to Owners",
            result["Percentage of Benefits to Owners"]
              ? result["Percentage of Benefits to Owners"] + "%"
              : "N/A"
          ],
          ["Test Result", result["Test Result"] ?? "N/A"],
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

      // Corrective actions & consequences (if test failed)
      if (result["Test Result"]?.toLowerCase() === "failed") {
        const correctiveActions = [
          "Review and adjust the classification of owners",
          "Consider increasing the number of non-owner employees",
          "Implement a plan to ensure a more balanced distribution of benefits",
        ];

        const consequences = [
          "IRS Scrutiny and Potential Penalties",
          "Reduced Employee Morale and Participation",
          "Risk of Plan Disqualification",
          "Reputational and Legal Risks",
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
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100, 100, 100);
      pdf.text("Generated via the Waypoint Reporting Engine", 10, 290);

      // Generate blob and save locally
      pdfBlob = pdf.output("blob");
      pdf.save("DCAP Owners Results.pdf");
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }
    try {
      await savePdfResultToFirebase({
        fileName: "DCAP Owners",
        pdfBlob,
        additionalData: {
          planYear,
          testResult: result["Test Result"] ?? "Unknown",
        },
      });
    } catch (error) {
      setError(`❌ Error saving PDF to Firebase: ${error.message}`);
    }
  };

  // =========================
  // 7. RENDER
  // =========================
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload DCAP Owners File
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
          <h3 className="font-bold text-xl text-gray-700">
            DCAP Owners Test Results
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
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Total Participants:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Participants"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg">
              <strong className="text-gray-700">Average DCAP Benefit for Owners:</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatCurrency(result?.["Average DCAP Benefit for Owners"])}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Percentage of Benefits to Owners:</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatPercentage(result?.["Percentage of Benefits to Owners"])}
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

          {/* Corrective actions & consequences if test fails */}
          {result["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black-600">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Review and adjust the classification of owners.</li>
                  <br />
                  <li>Consider increasing the number of non-owner employees.</li>
                  <br />
                  <li>Implement a plan to ensure a more balanced distribution of benefits.</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black-600">Consequences:</h4>
                <ul className="list-disc list-inside text-black-600">
                  <li>Loss of Tax-Exempt Status for Owners</li>
                  <br />
                  <li>IRS Scrutiny and Potential Penalties</li>
                  <br />
                  <li>Reduced Employee Morale and Participation</li>
                  <br />
                  <li>Risk of Plan Disqualification for Non-Compliance</li>
                  <br />
                  <li>Reputational and Legal Risks</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DCAPOwnersTest;
