const ACPTestMathBreakdown = ({ breakdown }) => {
  if (!breakdown) return null;

  return (
    <div className="mt-6 p-5 bg-gray-50 border border-gray-300 rounded-lg">
      <h3 className="font-bold text-lg text-gray-700 mb-4">Math Breakdown</h3>

      <div className="mb-4 p-3 bg-white border border-gray-300 rounded-md">
        <h4 className="font-semibold underline mb-2 text-indigo-600">Sums</h4>
        <p><strong>HCE Employer Match Sum:</strong> {breakdown["HCE Employer Match Sum"]}</p>
        <p><strong>HCE Compensation Sum:</strong> {breakdown["HCE Compensation Sum"]}</p>
        <p><strong>NHCE Employer Match Sum:</strong> {breakdown["NHCE Employer Match Sum"]}</p>
        <p><strong>NHCE Compensation Sum:</strong> {breakdown["NHCE Compensation Sum"]}</p>
      </div>

      <div className="mb-4 p-3 bg-white border border-gray-300 rounded-md">
        <h4 className="font-semibold underline mb-2 text-indigo-600">Percentages</h4>
        <p><strong>HCE ACP:</strong> {breakdown["HCE ACP"]}%</p>
        <p><strong>NHCE ACP:</strong> {breakdown["NHCE ACP"]}%</p>
        <p><strong>1.25 × NHCE ACP:</strong> {breakdown["1.25 * NHCE ACP"]}%</p>
      </div>

      <div className="p-3 bg-white border border-gray-300 rounded-md">
        <h4 className="font-semibold underline mb-2 text-indigo-600">Test Criterion</h4>
        <p>{breakdown["Test Criterion"]}</p>
      </div>
    </div>
  );
};

export default ACPTestMathBreakdown;
