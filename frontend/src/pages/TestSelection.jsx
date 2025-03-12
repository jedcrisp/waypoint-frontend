import { useState } from "react";
import { useNavigate } from "react-router-dom";

const TestSelection = () => {
  const navigate = useNavigate();

  const handleSelect = (test) => {
    navigate(test);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="relative inline-block text-left p-6 bg-white shadow-lg rounded-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-700 text-center mb-6">
          Choose a Non-Discriminatory Test
        </h3>

        {/* Actual Deferral Percentage (ADP) Test */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">
            Actual Deferral Percentage Test
          </h4>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-adp")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Run ADP Test
            </button>
          </div>
        </div>

        {/* Actual Contribution Percentage (ACP) Test */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">
            Actual Contribution Percentage Test
          </h4>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-acp")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Run ACP Test
            </button>
          </div>
        </div>

        {/* Cafeteria Plan Tests */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">
            Cafeteria Plan Tests
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-key-employee")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Key Employee Test
            </button>
            <button
              onClick={() => handleSelect("/test-eligibility")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Eligibility Test
            </button>
            <button
              onClick={() => handleSelect("/test-classification")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Classification Test
            </button>
            <button
              onClick={() => handleSelect("/test-benefit")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Benefit Test
            </button>
          </div>
        </div>

        {/* Health FSA Plans */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">
            Health FSA Plans
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-health-fsa-eligibility")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Health FSA Eligibility
            </button>
            <button
              onClick={() => handleSelect("/test-health-fsa-benefits")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Health FSA Benefits
            </button>
          </div>
        </div>

        {/* Dependent Care Assistance Program (DCAP) Plans */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">
            Dependent Care Assistance Program Plans
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-dcap-eligibility")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              DCAP Eligibility
            </button>
            <button
              onClick={() => handleSelect("/test-dcap-owners")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              DCAP Owners
            </button>
            <button
              onClick={() => handleSelect("/test-dcap-55-benefits")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              DCAP 55 Benefits
            </button>
            <button
              onClick={() => handleSelect("/test-dcap-contributions")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              DCAP Contributions
            </button>
          </div>
        </div>

        {/* Health Reimbursement Arrangement (HRA) */}
        <div>
          <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">
            Health Reimbursement Arrangement Plans
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-hra-benefits")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              HRA Benefits
            </button>
            <button
              onClick={() => handleSelect("/test-hra-eligibility")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              HRA Eligibility
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSelection;
