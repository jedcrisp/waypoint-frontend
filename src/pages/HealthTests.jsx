import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function HealthTests() {
  const navigate = useNavigate();

  // Navigate to the appropriate test page
  const navigateToTest = (testPage) => {
    navigate(testPage);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16 px-6">
      <h1 className="text-5xl font-light text-[#0074d9] mb-8">Health Plan Tests</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
        
        {/* Health FSA Eligibility Test */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Health FSA Eligibility Test</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that a sufficient percentage of non-highly compensated employees (NHCEs) are eligible to participate in the Health FSA.
            </p>
          </div>

          {/* Arrow Wrapper for Consistent Bottom Placement */}
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-health-fsa-eligibility")}
            />
          </div>
        </div>

        {/* Health FSA Benefits Test */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Health FSA Benefits Test</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that benefits and employer contributions are not disproportionately favoring Highly Compensated Individuals (HCIs).
            </p>
          </div>

          {/* Arrow Wrapper for Consistent Bottom Placement */}
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-health-fsa-benefits")}
            />
          </div>
        </div>

        {/* HRA Eligibility Test */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">HRA Eligibility Test</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that a sufficient percentage of non-highly compensated employees (NHCEs) are eligible to participate in the HRA.
            </p>
          </div>

          {/* Arrow Wrapper for Consistent Bottom Placement */}
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-hra-eligibility")}
            />
          </div>
        </div>

        {/* HRA Benefits Test */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">HRA Benefits Test</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that benefits and employer contributions are not disproportionately favoring Highly Compensated Employees (HCEs).
            </p>
          </div>

          {/* Arrow Positioned at the Bottom */}
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-hra-benefits")}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
