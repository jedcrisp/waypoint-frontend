import React from "react";

const CsvTemplateDownloader = () => {
  // Define CSV content as a 2D array, then convert to a string
  const csvArray = [
    [
      "Name",
      "Compensation",
      "Employee Deferral",
      "Employer Match",
      "HCE",
      "Key Employee",
      "Cafeteria Plan Benefits",
      "Eligible for Cafeteria Plan",
      "Eligible for FSA",
      "HCI",
      "Health FSA Benefits",
      "Eligible for DCAP",
      "TestOwnership %",
      "DCAP Benefits",
      "DCAP Contributions",
      "HRA Benefits",
      "Eligible for HRA"
    ],
    [
      "Employee 1",
      "22809",
      "723",
      "1932",
      "Yes",
      "Yes",
      "1424",
      "No",
      "No",
      "Yes",
      "1430",
      "No",
      "5.154512032",
      "917",
      "2365",
      "220",
      "No"
    ],
    [
      "Employee 2",
      "98678",
      "3076",
      "2466",
      "No",
      "No",
      "2653",
      "No",
      "No",
      "No",
      "1137",
      "No",
      "4.86179422",
      "4609",
      "2602",
      "4917",
      "No"
    ],
    [
      "Employee 3",
      "68219",
      "1449",
      "831",
      "Yes",
      "No",
      "1820",
      "No",
      "No",
      "No",
      "255",
      "No",
      "2.052411015",
      "1635",
      "5000",
      "4773",
      "No"
    ]
  ];

  const csvContent = csvArray.map((row) => row.join(",")).join("\n");

  const downloadCsv = () => {
    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    // Create a link element
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    // Set the download attribute with a filename
    link.setAttribute("download", "ndt_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4">
      <button
        onClick={downloadCsv}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Download CSV Template
      </button>
    </div>
  );
};

export default CsvTemplateDownloader;

