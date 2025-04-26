// src/components/EnrichedTable.jsx
import React from "react";
import PropTypes from "prop-types";

export default function EnrichedTable({
  filteredRows,
  summaryCounts,
  formatCurrency,
  formatPct,
}) {
  return (
    <div className="mt-6 bg-white rounded shadow p-4">
      <h4 className="font-bold mb-2">Enriched Employee Preview</h4>
      <div className="mb-4 text-sm flex gap-4">
        <span><strong>Total:</strong> {summaryCounts.total_employees}</span>
        <span><strong>Eligible:</strong> {summaryCounts.total_eligible}</span>
        <span><strong>Excluded:</strong> {summaryCounts.total_excluded}</span>
        <span><strong>HCEs:</strong> {summaryCounts.total_hces}</span>
        <span><strong>Participating:</strong> {summaryCounts.total_participating}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center border collapse">
          <thead>
            <tr>
              {[
                "Employee ID","Name","Status","HCE","Age",
                "Compensation","Employee Deferral","Years of Service",
                "Deferral %","Participating","Enrollment Status","Exclusion Reason"
              ].map(th => (
                <th key={th} className="border px-2 py-1 bg-gray-100">
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, i) => (
              <tr
                key={i}
                className={r.Eligible ? "bg-green-50" : "bg-red-50"}
              >
                <td className="border px-2 py-1">{r["Employee ID"]}</td>
                <td className="border px-2 py-1">
                  {r["First Name"]} {r["Last Name"]}
                </td>
                <td className="border px-2 py-1">
                  {r.Eligible ? "Eligible" : "Excluded"}
                </td>
                <td className="border px-2 py-1">
                  {r.HCE === "yes" ? "Yes" : "No"}
                </td>
                <td className="border px-2 py-1">
                  {typeof r.Age === "number" ? r.Age.toFixed(0) : r.Age}
                </td>
                <td className="border px-2 py-1">
                  {formatCurrency(r.Compensation)}
                </td>
                <td className="border px-2 py-1">
                  {formatCurrency(r["Employee Deferral"])}
                </td>
                <td className="border px-2 py-1">
                  {typeof r["Years of Service"] === "number"
                    ? r["Years of Service"].toFixed(1)
                    : r["Years of Service"]}
                </td>
                <td className="border px-2 py-1">
                  {formatPct(r["Deferral %"])}
                </td>
                <td className="border px-2 py-1">
                  {r.Participating ? "Yes" : "No"}
                </td>
                <td className="border px-2 py-1">
                  {r.Participating
                    ? "Participating"
                    : r.Eligible
                    ? "Not Participating"
                    : "Not Eligible"}
                </td>
                <td className="border px-2 py-1">
                  {r["Exclusion Reason"]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

EnrichedTable.propTypes = {
  filteredRows: PropTypes.array.isRequired,
  summaryCounts: PropTypes.object.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatPct: PropTypes.func.isRequired,
};
