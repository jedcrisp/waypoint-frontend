import React, { useState } from "react";
import DownloadReportButton from "../components/DownloadReportButton";

function ReportPage() {
  // State for the global report download URL
  const [downloadUrl, setDownloadUrl] = useState("");

  // List all your test names here for individual reports
  const tests = ["adp_test", "acp_test", "eligibility_test"];

  // Global report download handler
  const handleDownloadReport = async () => {
    try {
      // Replace with your actual backend endpoint for the global report.
      const response = await fetch("https://waypoint-app.up.railway.app/download-report");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setDownloadUrl(data.download_url);
    } catch (error) {
      console.error("Error fetching global report:", error);
    }
  };

  return (
    <div>
      <h1>Test Reports</h1>

      {/* Global Report Section */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Global Report</h2>
        <button onClick={handleDownloadReport}>Generate & Download Global Report</button>
        {downloadUrl && (
          <div>
            <p>Your global report is ready:</p>
            <a href={downloadUrl} download>
              Click here to download
            </a>
          </div>
        )}
      </section>

      {/* Individual Test Reports Section */}
      <section>
        <h2>Individual Test Reports</h2>
        <div>
          {tests.map((test) => (
            <div key={test} style={{ marginTop: "20px" }}>
              <h3>{test}</h3>
              <DownloadReportButton testName={test} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ReportPage;
