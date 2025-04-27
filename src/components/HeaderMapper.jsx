import React, { useEffect } from "react";
import PropTypes from "prop-types";

// Dictionary of header definitions and examples
const HEADER_INFO = {
  "Employee ID": {
    definition: "A unique identifier for each employee.",
    example: "E001",
  },
  "First Name": {
    definition: "The employee's first name.",
    example: "John",
  },
  "Last Name": {
    definition: "The employee's last name.",
    example: "Doe",
  },
  "DOB": {
    definition: "Date of Birth, the employee's birth date.",
    example: "1980-04-12",
  },
  "DOH": {
    definition: "Date of Hire, the date the employee was hired.",
    example: "2010-01-01",
  },
  "Employment Status": {
    definition: "The current employment status of the employee.",
    example: "Active, Terminated, Leave",
  },
  "Excluded from Test": {
    definition: "Indicates if the employee is excluded from the test (Yes/No).",
    example: "No",
  },
  "Union Employee": {
    definition: "Indicates if the employee is part of a union (Yes/No).",
    example: "No",
  },
  "Part-Time / Seasonal": {
    definition: "Indicates if the employee is part-time or seasonal (Yes/No).",
    example: "No",
  },
  "Plan Entry Date": {
    definition: "The date the employee became eligible for the plan.",
    example: "2010-01-01",
  },
  "Compensation": {
    definition: "The employee's annual compensation.",
    example: "200000",
  },
  "HCE": {
    definition: "Highly Compensated Employee status (Yes/No).",
    example: "Yes",
  },
  "Employee Deferral": {
    definition: "The amount the employee deferred into the plan.",
    example: "23500",
  },
  "Ownership %": {
    definition: "The percentage of ownership the employee has in the company.",
    example: "5",
  },
  "Family Relationship": {
    definition: "The type of family relationship to another employee, if any.",
    example: "spouse",
  },
  "Family Member": {
    definition: "The name of the related family member, if applicable.",
    example: "Jane Doe",
  },
  "Hours Worked": {
    definition: "Total hours worked by the employee in the plan year.",
    example: "2080",
  },
  "Termination Date": {
    definition: "The date the employee was terminated, if applicable.",
    example: "2022-09-01",
  },
  "Employer Match": {
    definition: "The amount of employer matching contributions.",
    example: "5000",
  },
  "Contribution Percentage": {
    definition: "The percentage of compensation contributed to the plan.",
    example: "5.0",
  },
  "Participating": {
    definition: "Indicates if the employee is participating in the plan (Yes/No).",
    example: "Yes",
  },
  "Total Contribution": {
    definition: "The total contributions (employee deferral + employer match).",
    example: "28500",
  },
  "Plan Assets": {
    definition: "The employee's total assets in the plan.",
    example: "50000",
  },
  "Key Employee": {
    definition: "Indicates if the employee is a key employee (Yes/No).",
    example: "Yes",
  },
  "Eligible for Plan": {
    definition: "Indicates if the employee is eligible to participate in the plan (Yes/No).",
    example: "Yes",
  },
};

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
  suggestedMap,
  isFileUploaded,
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
          <label className="w-1/3 font-medium group relative">
            {header} {mandatoryHeaders.includes(header) ? <span className="text-red-500">*</span> : ""}
            {/* Pop-up blurb on hover */}
            {HEADER_INFO[header] && (
              <span className="absolute top-[-80px] left-1/2 transform -translate-x-1/2 bg-blue-100 text-gray-800 text-sm p-2 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none min-w-[300px] z-10">
                <strong>{header}:</strong> {HEADER_INFO[header].definition}<br />
                <strong>Example:</strong> {HEADER_INFO[header].example}
              </span>
            )}
          </label>
          <select
            value={isFileUploaded && columnMap[header] ? columnMap[header] : "none"}
            onChange={(e) => handleMappingChange(header, e.target.value)}
            className="w-2/3 border rounded px-3 py-2"
            disabled={!isFileUploaded}
          >
            <option value="none">-- Select Column --</option>
            {rawHeaders.map(rawHeader => (
              <option key={rawHeader} value={rawHeader}>{rawHeader}</option>
            ))}
          </select>
        </div>
      ))}
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
  suggestedMap: PropTypes.object,
  isFileUploaded: PropTypes.bool.isRequired,
};
