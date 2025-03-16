import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ADPACPTests() {
  const navigate = useNavigate();

  // Navigate to the appropriate test page
  const navigateToTest = (testPage) => {
    navigate(testPage);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16 px-6">
      <h1 className="text-5xl font-light text-[#0074d9] mb-8">ADP and ACP Tests</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 w-full max-w-4xl justify-center">
        
        {/* ADP Test */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">ADP Test</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that the average deferral percentage (ADP) for Highly Compensated Employees (HCEs) does not exceed the ADP for Non-Highly Compensated Employees (NHCEs) by more than a specified limit.
            </p>
          </div>

          {/* Arrow Positioned Between Text and Bottom */}
          <div className="mt-4">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-adp")}
            />
          </div>
        </div>

        {/* ACP Test */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">ACP Test</h2>
            <p className="text-gray-700 text-sm mt-4">
              Ensures that the average contribution percentage (ACP) for Highly Compensated Employees (HCEs) does not exceed the ACP for Non-Highly Compensated Employees (NHCEs) by more than a specified limit.
            </p>
          </div>

          {/* Arrow Positioned Between Text and Bottom */}
          <div className="mt-4">
            <ArrowRight 
              className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
              onClick={() => navigateToTest("/test-acp")}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
