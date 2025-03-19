import React, { useState } from "react";

const DownloadReportButton = ({ testName }) => {
  const [downloadUrl, setDownloadUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadReport = async () => {
    setIsLoading(true);
    try {
      // Replace with your actual backend endpoint.
      // This example assumes your backend accepts a query parameter "test"
      // and returns JSON with a property "download_url".
      const response = await fetch(`https://waypoint-app.up.railway.app/download-report?test=${testName}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setDownloadUrl(data.download_url);
    } catch (error) {
      console.error(`Error fetching report for ${testName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <button onClick={handleDownloadReport}>
        {isLoading ? "Generating..." : `Generate & Download Report for ${testName}`}
      </button>
      {downloadUrl && (
        <div>
          <p>Your report for {testName} is ready:</p>
          <a href={downloadUrl} download>
            Click here to download
          </a>
        </div>
      )}
    </div>
  );
};

export default DownloadReportButton;
