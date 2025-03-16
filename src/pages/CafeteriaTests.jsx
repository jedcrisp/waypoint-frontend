import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CafeteriaTests() {
  const navigate = useNavigate();

  // Navigate to the appropriate test page
  const navigateToTest = (testPage) => {
    navigate(testPage);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16 px-6">
      <h1 className="text-5xl font-light text-[#0074d9] mb-8">Cafeteria Plan Tests</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
        
        {/* Key Employee Test */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Key Employee Test</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that Key Employees (owners, officers, or top earners) do not receive more than 25% of the total benefits under the Cafeteria Plan.
            </p>
          </div>

          {/* Arrow Wrapper for Consistent Bottom Placement */}
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-key-employee")}
            />
          </div>
        </div>

        {/* Eligibility Test */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Eligibility Test</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that a sufficient percentage of non-highly compensated employees (NHCEs) are eligible to participate in the Cafeteria Plan.
            </p>
          </div>

          {/* Arrow Wrapper for Consistent Bottom Placement */}
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-eligibility")}
            />
          </div>
        </div>

        {/* Classification Test */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Classification Test</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that a Cafeteria Plan’s eligibility rules do not unfairly favor Highly Compensated Employees (HCEs) or Key Employees over Non-Highly Compensated Employees (NHCEs).
            </p>
          </div>

          {/* Arrow Wrapper for Consistent Bottom Placement */}
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-classification")}
            />
          </div>
        </div>

        {/* Benefit Test */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Benefit Test</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that benefits and employer contributions are not disproportionately favoring HCEs or Key Employees.
            </p>
          </div>

          {/* Arrow Positioned at the Bottom */}
          <div className="mt-auto">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-benefit")}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
