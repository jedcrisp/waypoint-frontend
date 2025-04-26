
import React from "react";
import PropTypes from "prop-types";
import ConfirmModal from "./ConfirmModal";

export default function DownloadActions({
  isDownloadEnabled,
  onDownloadClick,
  showDownloadConfirm,
  onConfirmDownload,
  onCancelDownload,
  className,
}) {
  return (
    <div className="flex flex-col items-end relative group">
      <button
        onClick={onDownloadClick}
        disabled={!isDownloadEnabled}
        className={`px-4 py-2 rounded text-white ${
          isDownloadEnabled ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
        } ${className}`}
        aria-label="Download Mapped CSV"
      >
        Download Mapped CSV
      </button>
      {!isDownloadEnabled && (
        <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-gray-800 text-white text-sm rounded-lg py-2 px-3 shadow-lg z-10">
          Please map all required headers to enable download.
        </div>
      )}
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
    </div>
  );
}

DownloadActions.propTypes = {
  isDownloadEnabled: PropTypes.bool.isRequired,
  onDownloadClick: PropTypes.func.isRequired,
  showDownloadConfirm: PropTypes.bool.isRequired,
  onConfirmDownload: PropTypes.func.isRequired,
  onCancelDownload: PropTypes.func.isRequired,
  className: PropTypes.string,
};
