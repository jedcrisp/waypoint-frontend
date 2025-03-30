import React, { useState, useCallback } from "react";
import { savePdfResultToFirebase } from "../utils/firebaseTestSaver"; // Firebase Storage export helper
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";

const HRA25OwnerRuleTest = () => {
  const [file, setFile] = useState(null);
  const [planYear, setPlanYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Format Helpers
  const formatCurrency = (amount) =>
    !amount || isNaN(amount)
      ? "N/A"
      : `$${parseFloat(amount).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  const formatPercentage = (value) =>
    !value || isNaN(value) ? "N/A" : `${parseFloat(value).toFixed(2)}%`;

  // Handle Enter key for upload
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  // Drag & Drop Logic
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

  // Upload Handler
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
    formData.append("selected_tests", "hra_25_owner_rule");

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }
      const response = await axios.post(
        `${API_URL}/upload-csv/hra_25_owner_rule`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResult(response.data?.["Test Results"]?.["hra_25_owner_rule"] || {});
    } catch (err) {
      console.error("❌ Upload error:", err.response?.data || err.message);
      if (err.response?.status === 405) {
        setError("❌ Server rejected the request (405 Method Not Allowed). Check the endpoint and HTTP method.");
      } else {
        setError("❌ Failed to upload file. Please check the format and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // CSV Template Download
  const downloadCSVTemplate = () => {
    const csvData = [
      [
        "Last Name",
        "First Name",
        "Employee ID",
        "HRA Benefits",
        "Owner-Attributed Benefits",
        "DOB",
        "DOH",
        "Ownership %",
        "Family Member",
        "Employment Status",
        "Excluded from Test",
        "Plan Entry Date",
        "Union Employee",
        "Part-Time / Seasonal",
      ],
  ["Last", "First", "001", "2500", "600", "1980-05-10", "2010-06-01", "10", "No", "Active", "No", "2020-01-01", "No", "No"],
  ["Last", "First", "002", "3000", "800", "1975-08-15", "2008-03-10", "15", "No", "Active", "No", "2019-05-01", "No", "No"],
  ["Last", "First", "003", "2800", "700", "1982-02-20", "2011-07-15", "20", "Yes", "Active", "No", "2021-02-01", "Yes", "No"],
  ["Last", "First", "004", "2600", "650", "1978-11-30", "2009-05-20", "5", "No", "Active", "No", "2018-11-15", "No", "No"],
  ["Last", "First", "005", "3200", "850", "1985-06-25", "2012-09-30", "25", "Yes", "Active", "No", "2020-06-10", "No", "No"],
  ["Last", "First", "006", "2400", "500", "1979-03-14", "2010-12-01", "12", "No", "Active", "No", "2019-08-20", "No", "Yes"],
  ["Last", "First", "007", "3100", "900", "1983-08-05", "2013-04-10", "18", "No", "Active", "No", "2021-01-05", "Yes", "No"],
  ["Last", "First", "008", "2900", "750", "1981-12-12", "2010-11-11", "8", "No", "Active", "No", "2020-09-15", "No", "No"],
  ["Last", "First", "009", "2700", "680", "1977-07-07", "2007-03-25", "22", "Yes", "Active", "No", "2018-03-30", "No", "No"],
  ["Last", "First", "010", "3300", "950", "1986-04-18", "2014-10-20", "30", "No", "Active", "No", "2021-07-22", "Yes", "No"]
]; 

    const csvTemplate = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "HRA_25_Owner_Rule_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Results Download
  const downloadResultsAsCSV = () => {
    if (!result) {
      setError("❌ No results to download.");
      return;
    }
    const plan = planYear || "N/A";
    const totalEmployees = result["Total Employees"] ?? "N/A";
    const totalParticipants = result["Total Participants"] ?? "N/A";
    const totalHraBenefits = result["Total HRA Benefits"] ?? "N/A";
    const ownerAttributedBenefits = result["Owner-Attributed Benefits"] ?? "N/A";
    const ownerRulePercentage = result["Owner Rule Percentage"] ?? "N/A";
    const testResult = result["Test Result"] ?? "N/A";

    const csvRows = [
      ["Metric", "Value"],
      ["Plan Year", plan],
      ["Total Employees", totalEmployees],
      ["Total Participants", totalParticipants],
      ["Owner-Attributed Benefits", ownerAttributedBenefits],
      ["Owner Rule Percentage", `${ownerRulePercentage}%`],
      ["Total HRA Benefits", totalHraBenefits],
      ["Test Result", testResult],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "HRA_25_Owner_Rule_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export with Firebase Storage Integration
  const exportToPDF = async () => {
    if (!result) {
      setError("❌ No results available to export.");
      return;
    }
    let pdfBlob;
    try {
      const totalEmployees = result["Total Employees"] ?? "N/A";
      const totalParticipants = result["Total Participants"] ?? "N/A";
      const totalHraBenefits = result["Total HRA Benefits"] ?? "N/A";
      const ownerAttributedBenefits = result["Owner-Attributed Benefits"] ?? "N/A";
      const ownerRulePercentage = result["Owner Rule Percentage"] ?? "N/A";
      const testResult = result["Test Result"] ?? "N/A";
      const failed = testRes.toLowerCase() === "failed";
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setFont("helvetica", "normal");

      // Header
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("HRA 25% Owner Rule Test Results", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Plan Year: ${planYear}`, 105, 25, { align: "center" });
      const generatedTimestamp = new Date().toLocaleString();
      pdf.text(`Generated on: ${generatedTimestamp}`, 105, 32, { align: "center" });

      // Results Table
      pdf.autoTable({
        startY: 40,
        theme: "grid",
        head: [["Metric", "Value"]],
        body: [
          ["Total Employees", result["Total Employees"]],
          ["Total Participants", result["Total Participants"]],
          ["Owner-Attributed Benefits", formatCurrency(result["Owner-Attributed Benefits"])],
          ["Owner Rule Percentage", formatPercentage(result["Owner Rule Percentage"])],
          ["Total HRA Benefits", formatCurrency(result["Total HRA Benefits"])],
          ["Test Result", testResult],
        ],
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 12 },
        margin: { left: 10, right: 10 },
      });

      // Corrective Actions & Consequences (if test failed)
      if (failed) {
        const y = pdf.lastAutoTable.finalY + 10;
        pdf.setFillColor(255, 230, 230);
        pdf.setDrawColor(255, 0, 0);
        pdf.rect(10, y, 190, 30, "FD");
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Corrective Actions:", 15, y + 7);
        const actions = [
          "Review owner-related benefit allocations to ensure compliance with the 25% rule",
          "Adjust plan design to lower the proportion of benefits going to owners",
          "Consider additional corrective contributions if necessary",
        ];
        actions.forEach((action, i) => pdf.text(action, 15, y + 14 + i * 5));

        const y2 = y + 40;
        pdf.setFillColor(255, 255, 204);
        pdf.setDrawColor(255, 204, 0);
        pdf.rect(10, y2, 190, 30, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(204, 153, 0);
        pdf.text("Consequences:", 15, y2 + 10);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        const consequences = [
          "Taxation of FSA benefits for key employees",
          "Increased IRS scrutiny and potential penalties",
          "Risk of plan disqualification",
          "Retroactive correction requirements",
        ];
        consequences.forEach((item, i) => pdf.text(item, 15, y2 + 18 + i * 5));
      }

      // Generate PDF blob and trigger local download
      pdfBlob = pdf.output("blob");
      pdf.save("HRA_25_Owner_Rule_Results.pdf");
    } catch (error) {
      setError(`❌ Error exporting PDF: ${error.message}`);
      return;
    }
    try {
      // Upload PDF blob to Firebase Storage
      await savePdfResultToFirebase({
        fileName: "HRA 25% Owner Rule",
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

  // Handle Enter key
  const handleKeyDownWrapper = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDownWrapper}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload HRA 25% Owner Rule File
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
        <input
          type="file"
          accept=".csv, .xlsx"
          onChange={(e) => setFile(e.target.files[0])}
          className="hidden"
        />
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
        onClick={() => open()}
        className="mt-4 w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
      >
        Choose File
      </button>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        className={`w-full mt-4 px-4 py-2 text-white rounded-md ${
          !file || !planYear ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-400"
        }`}
        disabled={!file || !planYear || loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* Display Results */}
      {result && (
        <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
          <h3 className="font-bold text-xl text-gray-700">
            HRA 25% Owner Rule Test Results
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
                {result?.["Total Employees"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg">
              <strong className="text-gray-700">Total Participants:</strong>{" "}
              <span className="font-semibold text-black-600">
                {result?.["Total Participants"] ?? "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Owner-Attributed Benefits:</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatCurrency(result["Owner-Attributed Benefits"])}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">Owner Benefit Percentage:</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatPercentage(result["Owner Benefit Percentage"])}
              </span>
            </p>
            <p className="text-lg">
              <strong className="text-gray-700">Total HRA Benefits:</strong>{" "}
              <span className="font-semibold text-black-600">
                {formatCurrency(result["Total HRA Benefits"])}
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

         {/* Display Corrective Actions & Consequences if Test Failed */}
          {result?.["Test Result"]?.toLowerCase() === "failed" && (
            <>
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md">
                <h4 className="font-bold text-black">Corrective Actions:</h4>
                <ul className="list-disc list-inside text-black">
                  <li>
                    Review owner-related benefit allocations to ensure compliance with the 25% rule.
                  </li>
                  <br />
                  <li>
                    Adjust plan design to lower the proportion of benefits going to owners.
                  </li>
                  <br />
                  <li>
                    Consider additional corrective contributions if necessary.
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                <h4 className="font-bold text-black">Consequences:</h4>
                <ul className="list-disc list-inside text-black">
                  <li>Benefits allocated to owners may become taxable.</li>
                  <br />
                  <li>Employer may face IRS penalties and additional corrective measures.</li>
                  <br />
                  <li>Increased administrative and compliance burdens.</li>
                 </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HRA25OwnerRuleTest;
