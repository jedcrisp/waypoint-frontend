import React from "react";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";

const steps = [
  {
    target: ".test-dropdown-select",
    content: "Select a test to begin building your CSV.",
    event: "click",
    placement: "bottom",
    offset: 10,
    disableBeacon: true,
    disableCloseOnEsc: false,
  },
  {
    target: ".plan-year-select",
    content: "Choose the plan year for your test.",
    event: "click",
    placement: "bottom",
    offset: 10,
    disableBeacon: true,
    disableCloseOnEsc: false,
  },
  {
  target: ".download-blank-template-button",
  content: "Click here to download a completely blank CSV template for chosen test’s headers—no mapping needed!",
  event: "click",
  placement: "bottom",
  offset: 10,
  disableBeacon: true,
  disableCloseOnEsc: false,
},
  {
    target: ".file-uploader",
    content: "Upload your CSV file here.",
    event: "click",
    placement: "bottom",
    offset: 10,
    disableBeacon: true,
    disableCloseOnEsc: false,
  },
  {
    target: ".header-mapper",
    content: "Map your CSV headers to the required fields.",
    event: "click",
    placement: "bottom",
    offset: 10,
    disableBeacon: true,
    disableCloseOnEsc: false,
  },
  {
    target: ".download-csv-button",
    content: "Download your mapped CSV file, now ready for testing.",
    event: "click",
    placement: "bottom",
    offset: 10,
    disableBeacon: true,
    disableCloseOnEsc: false,
  },
];

const CSVBuilderTour = ({ run, callback }) => {
  return (
    <Joyride
      steps={steps}
      run={run}
      callback={(data) => {
        const { action, status } = data;
        // Debug the CLOSE action
        if (action === ACTIONS.CLOSE) {
          console.log("CLOSE action detected, stopping tour");
          callback({ status: STATUS.SKIPPED });
        }
        // Handle FINISHED or SKIPPED status
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
          console.log("Tour finished or skipped, status:", status);
          callback({ status });
        }
      }}
      continuous
      showProgress
      styles={{
        options: {
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: "#2563EB", // Tailwind blue-600 to match the "Preview Data" button (assumed navbar color)
          color: "white",
          borderRadius: "4px",
          padding: "8px 16px",
        },
        buttonBack: {
          color: "#2563EB",
        },
        buttonSkip: {
          color: "#2563EB",
        },
      }}
    />
  );
};

export default CSVBuilderTour;
