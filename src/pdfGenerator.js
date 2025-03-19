import React from "react";
import { jsPDF } from "jspdf";

export default function DownloadButton() {
  const handleDownloadPdf = () => {
    const planYear = "2023";
    const officialDate = new Date().toLocaleDateString();
    const officialTime = new Date().toLocaleTimeString();
    const testOutput = "Your test output details here...";

    const doc = new jsPDF();
    let yPosition = 20;
    doc.setFontSize(12);
    doc.text(`Plan Year: ${planYear}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Official Date: ${officialDate}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Official Time: ${officialTime}`, 10, yPosition);
    yPosition += 15;

    doc.setFontSize(14);
    doc.text("Test Output:", 10, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    const lines = doc.splitTextToSize(testOutput, 180);
    doc.text(lines, 10, yPosition);

    doc.save(`test-output-${officialDate}.pdf`);
  };

  return (
    <button onClick={handleDownloadPdf}>
      Download PDF
    </button>
  );
}
