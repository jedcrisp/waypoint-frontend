import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function DCAPTests() {
  const navigate = useNavigate();

  // Navigate to the appropriate test page
  const navigateToTest = (testPage) => {
    navigate(testPage);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16 px-6">
      <h1 className="text-5xl font-light text-[#0074d9] mb-8">
        Dependent Care Assistance Program (DCAP)
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
        {/* DCAP Eligibility */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">DCAP Eligibility</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that a broad group of employees—not just Highly Compensated Employees (HCEs) or Key Employees—are eligible to participate in the DCAP.
            </p>
          </div>
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-dcap-eligibility")}
            />
          </div>
        </div>

        {/* DCAP Owners */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">DCAP Owners</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that a DCAP does not disproportionately benefit Key Employees, such as company owners and high-level executives.
            </p>
          </div>
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-dcap-owners")}
            />
          </div>
        </div>

        {/* DCAP 55 Benefits */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">DCAP 55 Benefits</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that the average benefits received by Non-HCEs is at least 55% of the average benefits received by HCEs.
            </p>
          </div>
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-dcap-55-benefits")}
            />
          </div>
        </div>

        {/* DCAP Contributions */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">DCAP Contributions</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that benefits or employer contributions under the DCAP are not disproportionately larger for HCEs or Key Employees.
            </p>
          </div>
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-dcap-contributions")}
            />
          </div>
        </div>

        {/* DCAP Key Employee Concentration Test (>25%) */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              DCAP Key Employee Concentration Test (&gt;25%)
            </h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that key employees do not receive more than 25% of the total DCAP benefits.
            </p>
          </div>
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-dcap-key-employee-concentration")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
