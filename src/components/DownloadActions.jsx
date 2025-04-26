// src/components/DownloadActions.jsx
import React from "react";
import PropTypes from "prop-types";
import ConfirmModal from "./ConfirmModal";

export default function DownloadActions({
  isDownloadEnabled,
  onDownloadClick,
  showDownloadConfirm,
  onConfirmDownload,
  onCancelDownload,
}) {
  return (
    <>
      <button
        onClick={onDownloadClick}
        disabled={!isDownloadEnabled}
        className={`px-4 py-2 rounded text-white ${
          isDownloadEnabled
            ? "bg-green-600 hover:bg-green-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
        aria-label="Download Mapped CSV"
      >
        Download Mapped CSV
      </button>

      {showDownloadConfirm && (
        <ConfirmModal
          title="Confirm Download"
          message="Are you sure the CSV is accurate and ready for testing?"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={onConfirmDownload}
          onCancel={onCancelDownload}
        />
      )}
    </>
  );
}

DownloadActions.propTypes = {
  isDownloadEnabled: PropTypes.bool.isRequired,
  onDownloadClick: PropTypes.func.isRequired,
  showDownloadConfirm: PropTypes.bool.isRequired,
  onConfirmDownload: PropTypes.func.isRequired,
  onCancelDownload: PropTypes.func.isRequired,
};
