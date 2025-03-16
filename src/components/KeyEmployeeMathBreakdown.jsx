import React from "react";

const KeyEmployeeMathBreakdown = ({ breakdown }) => {
  return (
    <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg shadow-lg">
      <h3 className="font-bold text-2xl text-gray-700 mb-4">
        📊 Math Breakdown
      </h3>

      <div className="mb-4 p-4 bg-white border border-gray-300 rounded-md shadow">
        <h4 className="font-semibold text-indigo-600 text-lg mb-2 underline">
          Sums
        </h4>
        <p><strong>🧑‍🤝‍🧑 Total Employees:</strong> {breakdown["Total Employees"]}</p>
        <p><strong>👥 Key Employees:</strong> {breakdown["Key Employees"]}</p>
      </div>

      <div className="mb-4 p-4 bg-white border border-gray-300 rounded-md shadow">
        <h4 className="font-semibold text-indigo-600 text-lg mb-2 underline">
          Percentages
        </h4>
        <p><strong>📊 Key Employee Percentage:</strong> {breakdown["Key Employee Percentage"]}%</p>
        <p><strong>✅ Passing Criterion:</strong> ≤ 20%</p>
      </div>
    </div>
  );
};

export default KeyEmployeeMathBreakdown;
