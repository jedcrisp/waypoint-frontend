// src/components/HeaderMapper.jsx
import React from "react";
import PropTypes from "prop-types";

export default function HeaderMapper({
  rawHeaders,
  requiredHeaders,
  columnMap,
  setColumnMap,
  mandatoryHeaders,
  autoGenerateHCE,
  canAutoGenerateHCE,
  autoGenerateKeyEmployee,
  canAutoGenerateKeyEmployee,
}) {
  const handleChange = (header, val) => {
    setColumnMap(prev => ({ ...prev, [header]: val }));
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {requiredHeaders.map(header => (
        <React.Fragment key={header}>
          <div className="bg-gray-100 px-4 py-2 rounded flex items-center">
            {mandatoryHeaders.includes(header) && (
              <span className="text-red-500 mr-1">*</span>
            )}
            {header}
          </div>
          <select
            value={columnMap[header] || ""}
            onChange={e => handleChange(header, e.target.value)}
            className="border rounded px-3 py-2"
            aria-label={`Map column for ${header}`}
          >
            <option value="">-- Select Column --</option>
            {rawHeaders.map(raw => (
              <option key={raw} value={raw}>{raw}</option>
            ))}
          </select>
        </React.Fragment>
      ))}

      {/* HCE auto-gen checkbox */}
      {requiredHeaders.includes("HCE") && !columnMap["HCE"] && (
        <label className="col-span-2 bg-yellow-100 p-2 rounded flex items-center">
          <input
            type="checkbox"
            checked={autoGenerateHCE}
            onChange={e => setColumnMap(prev => ({ ...prev, autoHCE: e.target.checked }))}
            disabled={!canAutoGenerateHCE()}
            className="mr-2"
          />
          Auto-generate HCE from compensation
        </label>
      )}

      {/* Key Employee auto-gen checkbox */}
      {requiredHeaders.includes("Key Employee") && !columnMap["Key Employee"] && (
        <label className="col-span-2 bg-yellow-100 p-2 rounded flex items-center">
          <input
            type="checkbox"
            checked={autoGenerateKeyEmployee}
            onChange={e => setColumnMap(prev => ({ ...prev, autoKey: e.target.checked }))}
            disabled={!canAutoGenerateKeyEmployee()}
            className="mr-2"
          />
          Auto-generate Key Employee status
        </label>
      )}
    </div>
  );
}

HeaderMapper.propTypes = {
  rawHeaders: PropTypes.array.isRequired,
  requiredHeaders: PropTypes.array.isRequired,
  columnMap: PropTypes.object.isRequired,
  setColumnMap: PropTypes.func.isRequired,
  mandatoryHeaders: PropTypes.array.isRequired,
  autoGenerateHCE: PropTypes.bool,
  canAutoGenerateHCE: PropTypes.func,
  autoGenerateKeyEmployee: PropTypes.bool,
  canAutoGenerateKeyEmployee: PropTypes.func,
};
