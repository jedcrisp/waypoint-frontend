import React, { useState, useCallback } from "react";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Firebase PDF saver
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const HRAKeyEmployeeConcentrationTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState(""); // Plan year state
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

  // ----- 1. Drag & Drop Logic -----
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
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

  // ----- 2. Handle Enter Key -----
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // ----- 3. Upload File to Backend -----
  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }
    if (!planYear) {
      setError("❌ Please select a plan year.");
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
    formData.append("selected_tests", "hra_key_employee_concentration");

    try {
      console.log("🚀 Uploading file to API:", `${API_URL}/upload-csv/hra_key_employee_concentration`);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      console.log("Firebase Token:", token);

      const response = await axios.post(
        `${API_URL}/upload-csv/hra_key_employee_concentration`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("✅ API Response:", response.data);
      setResult(response.data?.["Test Results"]?.["hra_key_employee_concentration"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response ? err.response.data : err.message);
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ----- 4. Download CSV Template -----
  const downloadCSVTemplate = () => {
    const csvTemplate = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "HRA Benefits",
        "Key Employee",
        "DOB",
        "DOH",
        "Employment Status",
        "Excluded from Test",
        "Union Employee",
        "Part-Time / Seasonal",
        "Plan Entry Date",
      ],
      ["Last", "First", "001", "2500", "No", "1980-05-10", "2010-06-01", "Active", "No", "No", "No", "2010-01-01"],
      ["Last", "First", "002", "3000", "Yes", "1975-08-15", "2008-03-15", "Active", "No", "No", "No", "2008-01-01"],
      ["Last", "First", "003", "0", "No", "1990-12-01", "2022-01-10", "Active", "No", "No", "No", "2022-01-01"],
      ["Last", "First", "004", "4000", "Yes", "1985-03-22", "2015-09-01", "Active", "No", "No", "No", "2015-01-01"],
      ["Last", "First", "005", "0", "No", "2000-07-07", "2023-01-15", "Terminated", "Yes", "No", "No", "2023-01-01"],
      ["Last", "First", "006", "3200", "Yes", "1988-10-10", "2018-11-11", "Active", "No", "No", "No", "2018-01-01"],
      ["Last", "First", "007", "2800", "No", "1995-04-04", "2020-07-07", "Active", "No", "No", "No", "2020-01-01"],
      ["Last", "First", "008", "0", "No", "1992-06-18", "2019-12-12", "Active", "No", "No", "No", "2019-01-01"],
      ["Last", "First", "009", "3500", "Yes", "1982-09-09", "2012-02-02", "Active", "No", "No", "No", "2012-01-01"],
      ["Last", "First", "010", "0", "No", "2000-11-11", "2023-03-03", "Active", "No", "No", "No", "2023-01-01"],
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "HRA Key Employee Concentration Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 5. Download Results as CSV -----
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const totalHRABenefits = result["Total HRA Benefits"] ?? "N/A";
    const keyEmployeeBenefits = result["Key Employee Benefits"] ?? "N/A";
    const keyEmployeeBenefitPercentage = result["Key Employee Benefit Percentage"] ?? "N/A";
    const testRes = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Total Participants", totalParticipants],  
      ["Total HRA Benefits", totalHRABenefits],
      ["Key Employee Benefits", keyEmployeeBenefits],
      ["Key Employee Benefit Percentage", keyEmployeeBenefitPercentage],
      ["Test Result", testRes],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "HRA Key Employee Concentration Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- 6. Export to PDF with Firebase Storage Integration -----
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    let pdfBlob;
    try {
      const totalEmployees = result["Total Employees"] ?? "N/A";
      const totalParticipants = result["Total Participants"] ?? "N/A";
      const keyEmployeeBenefits = formatCurrency(result["Key Employee Benefits"]) || "N/A";
      const keyEmployeeBenefitPercentage = formatPercentage(result["Key Employee Benefit Percentage"]) || "N/A";
      const testRes = result["Test Result"] ?? "N/A";
      const failed = testRes.toLowerCase() === "failed";

      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("HRA Key Employee Concentration Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear || "N/A"}`, 105, 25, { align: "center" });
      const generatedTimestamp = new Date().toLocaleString();
      pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

      // Subheader with test criterion
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60);
    pdf.text(
      "Test Criterion: IRC §125(b)(5): No more than 25% of total HRA benefits may be provided to Key Employees.",
      105,
      38,
      { align: "center", maxWidth: 180 }
    );

      // Results Table
      pdf.autoTable({
        startY: 47,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", totalEmployees],
          ["Total Participants", totalParticipants],
          ["Total HRA Benefits", formatCurrency(result["Total HRA Benefits"]) || "N/A"],
          ["Key Employee Benefits", keyEmployeeBenefits],
          ["Key Employee Benefit Percentage", keyEmployeeBenefitPercentage],
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

      // If test failed, add corrective actions & consequences
      if (failed) {
        const correctiveActions = [
          "Review and adjust the allocation of HRA benefits for key employees.",
          "Modify plan design to lower the concentration among key employees.",
          "Reevaluate eligibility criteria to ensure compliance.",
        ];
        const consequences = [
          "Benefits for key employees may be reclassified as taxable.",
          "Employer may need to make corrective contributions.",
          "Increased IRS scrutiny and potential penalties.",
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
          body: consequences.map((item) => [item]),
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

      try {
        pdfBlob = pdf.output("blob");
        pdf.save("HRA Key Employee Concentration Results.pdf");
      } catch (error) {
        setError(`❌ Error exporting PDF: ${error.message}`);
        return;
      }
      try {
        await savePdfResultToFirebase({
          fileName: "HRA Key Employee Concentration",
          pdfBlob,
          additionalData: {
            planYear,
            testResult: testRes || "Unknown",
          },
        });
      } catch (error) {
        setError(`❌ Error saving PDF to Firebase: ${error.message}`);
      }
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
    }
  };


  // ----- 8. Render -----
  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload HRA Key Employee Concentration File
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
        <input type="file" accept=".csv, .xlsx" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
        {file ? (
          <p className="text-green-600 font-semibold">{file.name}</p>
        ) : isDragActive ? (
          <p className="text-blue-600">📂 Drop the file here...</p>
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
          <h3 className="font-bold text-xl text-gray-700">HRA Key Employee Concentration Test Results</h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong>Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
            </p>
            <p className="text-lg mt-2">
              <strong>Total Employees:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong>Total Participants:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Participants"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong>Key Employee Benefits:</strong>{" "}
              {formatCurrency(result["Key Employee Benefits"] ?? "N/A")}
            </p>
            <p className="text-lg mt-2">
              <strong>Key Employee Benefit Percentage:</strong>{" "}
              {formatPercentage(result["Key Employee Benefit Percentage"] ?? "N/A")}
            </p>
            <p className="text-lg mt-2">
              <strong>Total HRA Benefits:</strong>{" "}
              {formatCurrency(result["Total HRA Benefits"] ?? "N/A")}
            </p>
            <p className="text-lg mt-2">
              <strong>Test Result:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-md font-bold ${
                  result["Test Result"] === "Passed" ? "bg-green-500 text-white" : "bg-red-500 text-white"
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
          {result?.["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black">
                  <li>
                    Review HRA plan design to ensure NHCE benefits are at least 55% of HCE benefits.
                  </li>
                  <br />
                  <li>
                    Adjust employer contributions to balance HRA benefits distribution.
                  </li>
                  <br />
                  <li>
                    Enhance communication to improve NHCE participation.
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black">Consequences:</h4>
                <ul className="list-disc list-inside text-black">
                  <li>HRA benefits for HCEs may become taxable.</li>
                  <br />
                  <li>Increased IRS audit risk.</li>
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

export default HRAKeyEmployeeConcentrationTest;
