import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getAuth } from "firebase/auth"; // Firebase Auth
import jsPDF from "jspdf";
import "jspdf-autotable";

function AdpTest() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [planYear, setPlanYear] = useState(""); // State for the plan year dropdown

  const API_URL = import.meta.env.VITE_BACKEND_URL 

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ".csv, .xls, .xlsx", // Include .xlsx files
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file before uploading.");
      return;
    }

    const validFileTypes = [".csv", ".xlsx"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!validFileTypes.includes(`.${fileExtension}`)) {
      setError("❌ Invalid file type. Please upload a CSV or Excel file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("selected_tests", "adp");

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError("❌ No valid Firebase token found. Are you logged in?");
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/upload-csv/adp`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const adpResults = response.data?.["Test Results"]?.["adp"];
      if (!adpResults) {
        setError("❌ No ADP test results found in response.");
      } else {
        setResult(adpResults);
      }
    } catch (err) {
      setError("❌ Failed to upload file. Please check the format and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && file && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleUpload();
    }
  };

  const downloadCSVTemplate = () => {
    const csvTemplate = [
      ["Name", "Compensation", "Employee Deferral", "HCE"],
      ["Example Employee 1", "123", "55000", "Yes"],
      ["Example Employee 2", "456", "60000", "No"],
      ["Example Employee 3", "789", "70000", "No"],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "adp_test_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
  if (!result) {
    setError("❌ No results available to export.");
    return;
  }

  const pdf = new jsPDF("p", "mm", "a4"); // Portrait, millimeters, A4 size
  pdf.setFont("helvetica", "normal");

  // Title
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("ADP Test Results", 105, 15, { align: "center" });

  // Subtitle
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Plan Year: ${planYear || "N/A"}`, 105, 25, { align: "center" });

  // Section 1: Eligibility Test Results
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("I. Eligibility Test Results (70% Test & 70%/80% Test)", 10, 40);

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    "If this test fails, we run the 70/80 Test. In order to pass the eligibility test, one of the three subtests has to pass.",
    10,
    45,
    { maxWidth: 190 }
  );

  // Table for 70% Test & 70%/80% Test
  pdf.autoTable({
    startY: 55,
    head: [["70% Test", "70%/80% Test"]],
    body: [
      [
        `Score: ${result["HCE ADP (%)"] || "N/A"} - ${
          result["Test Result"] === "Passed" ? "PASS" : "FAIL"
        }`,
        `Score: ${result["NHCE ADP (%)"] || "N/A"} - ${
          result["Test Result"] === "Passed" ? "PASS" : "FAIL"
        }`,
      ],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
  });

  // Section 2: Nondiscriminatory Classification Test
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("II. Eligibility Test Results (Nondiscriminatory Classification Test)", 10, pdf.lastAutoTable.finalY + 10);

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    "This test ensures that the plan does not discriminate in favor of highly compensated employees.",
    10,
    pdf.lastAutoTable.finalY + 15,
    { maxWidth: 190 }
  );

  // Table for Nondiscriminatory Classification Test
  pdf.autoTable({
    startY: pdf.lastAutoTable.finalY + 25,
    head: [["Metric", "Value", "Result"]],
    body: [
      ["HCE ADP (%)", `${result["HCE ADP (%)"] || "N/A"}%`, result["Test Result"] === "Passed" ? "PASS" : "FAIL"],
      ["NHCE ADP (%)", `${result["NHCE ADP (%)"] || "N/A"}%`, result["Test Result"] === "Passed" ? "PASS" : "FAIL"],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
  });

  // Section 3: Summary in a Box
  const summaryStartY = pdf.lastAutoTable.finalY + 40;
  const boxWidth = 190;
  const boxHeight = 30;

  // Draw the box
  pdf.setDrawColor(0, 0, 0); // Black border
  pdf.setLineWidth(0.5);
  pdf.rect(10, summaryStartY, boxWidth, boxHeight, "S"); // "S" for stroke

  // Add text inside the box
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("✔ You have successfully passed the Actual Deferral Percentage Test.", 12, summaryStartY + 8);

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    "Under Section 105(h), the Eligibility Test only requires the employer to pass one of the specified tests.",
    12,
    summaryStartY + 14,
    { maxWidth: 186 }
  );

  // Footer
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(100, 100, 100); // Light gray text
  pdf.text("Generated by ADP Test Tool", 10, 290);

  // Save the PDF
  pdf.save("ADP_Test_Results.pdf");
};

  return (
    <div
      className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg border border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
        📂 Upload ADP File
      </h2>

      {/* Plan Year Dropdown */}
      <div className="mb-6">
        <div className="flex items-center">
          {planYear === "" && <span className="text-red-500 text-lg mr-2">*</span>}
          <select
            id="planYear"
            value={planYear}
            onChange={(e) => setPlanYear(e.target.value)}
            className="flex-3 px-4 py-2 border border-gray-300 rounded-md"
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
          isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-gray-50"
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
          !file || !planYear
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        disabled={!file || !planYear || loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* Display Errors */}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      {/* Display Results */}
      {result && (
        <div
          id="results-section"
          className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg"
        >
          <h3 className="font-bold text-xl text-gray-700 flex items-center">
            ADP Test Results
          </h3>
          <div className="mt-4">
            <p className="text-lg">
              <strong className="text-gray-700">Plan Year:</strong>{" "}
              <span className="font-semibold text-blue-600">{planYear || "N/A"}</span>
            </p>
            <p className="text-lg">
              <strong className="text-gray-700">HCE ADP:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {result["HCE ADP (%)"] !== undefined
                  ? result["HCE ADP (%)"] + "%"
                  : "N/A"}
              </span>
            </p>
            <p className="text-lg mt-2">
              <strong className="text-gray-700">NHCE ADP:</strong>{" "}
              <span className="font-semibold text-green-600">
                {result["NHCE ADP (%)"] !== undefined
                  ? result["NHCE ADP (%)"] + "%"
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

          {/* Export to PDF Button */}
          <button
            onClick={exportToPDF}
            className="mt-4 w-full px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md"
          >
            Export to PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default AdpTest;
