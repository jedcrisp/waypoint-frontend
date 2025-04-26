import React, { useEffect } from "react";
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
  suggestedMap, // New prop for suggested mappings
}) {
  // Initialize columnMap with suggestedMap on first render
  useEffect(() => {
    if (Object.keys(columnMap).length === 0 && Object.keys(suggestedMap).length > 0) {
      setColumnMap(suggestedMap);
    }
  }, [suggestedMap, columnMap, setColumnMap]);

  const handleMappingChange = (header, value) => {
    setColumnMap(prev => ({
      ...prev,
      [header]: value === "none" ? undefined : value,
    }));
  };

  const toggleAutoGenerateHCE = () => {
    setColumnMap(prev => ({
      ...prev,
      autoHCE: !prev.autoHCE,
    }));
  };

  const toggleAutoGenerateKeyEmployee = () => {
    setColumnMap(prev => ({
      ...prev,
      autoKey: !prev.autoKey,
    }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Map Headers</h2>
      {requiredHeaders.map(header => (
        <div key={header} className="flex items-center gap-4">
          <label className="w-1/3 font-medium">{header} {mandatoryHeaders.includes(header) ? <span className="text-red-500">*</span> : ""}</label>
          <select
            value={columnMap[header] || "none"}
            onChange={(e) => handleMappingChange(header, e.target.value)}
            className="w-2/3 border rounded px-3 py-2"
          >
            <option value="none">-- Select Column --</option>
            {rawHeaders.map(rawHeader => (
              <option key={rawHeader} value={rawHeader}>{rawHeader}</option>
            ))}
          </select>
        </div>
      ))}
      {canAutoGenerateHCE() && (
        <div className="flex items-center gap-4">
          <label className="w-1/3 font-medium">Auto-generate HCE</label>
          <input
            type="checkbox"
            checked={autoGenerateHCE}
            onChange={toggleAutoGenerateHCE}
            className="w-2/3"
          />
        </div>
      )}
      {canAutoGenerateKeyEmployee() && (
        <div className="flex items-center gap-4">
          <label className="w-1/3 font-medium">Auto-generate Key Employee</label>
          <input
            type="checkbox"
            checked={autoGenerateKeyEmployee}
            onChange={toggleAutoGenerateKeyEmployee}
            className="w-2/3"
          />
        </div>
      )}
    </div>
  );
}

HeaderMapper.propTypes = {
  rawHeaders: PropTypes.arrayOf(PropTypes.string).isRequired,
  requiredHeaders: PropTypes.arrayOf(PropTypes.string).isRequired,
  columnMap: PropTypes.object.isRequired,
  setColumnMap: PropTypes.func.isRequired,
  mandatoryHeaders: PropTypes.arrayOf(PropTypes.string).isRequired,
  autoGenerateHCE: PropTypes.bool,
  canAutoGenerateHCE: PropTypes.func.isRequired,
  autoGenerateKeyEmployee: PropTypes.bool,
  canAutoGenerateKeyEmployee: PropTypes.func.isRequired,
  suggestedMap: PropTypes.object, // New prop for suggested mappings
};
