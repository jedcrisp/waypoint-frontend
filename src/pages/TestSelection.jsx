import React from "react";
import { useNavigate } from "react-router-dom";

const TestSelection = () => {
  const navigate = useNavigate();

  const handleSelect = (route) => {
    navigate(route);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <div className="relative inline-block text-left p-6 bg-white shadow-lg rounded-lg border border-gray-200 w-full max-w-4xl">
        <h3 className="text-2xl font-bold text-gray-700 text-center mb-8">
          Choose a Non-Discriminatory Test
        </h3>

        {/* 401(k) & Retirement Plan Tests */}
        <div className="mb-8">
          <h4 className="text-xl font-semibold text-gray-700 mb-3 text-center">
            401(k) & Retirement Plan Tests
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-adp")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              ADP Standard Test
            </button>
            <button
              onClick={() => handleSelect("/test-safe-harbor-401k")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              ADP Safe Harbor Test
            </button>
            <button
              onClick={() => handleSelect("/test-adp-safe-harbor-sliding")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              ADP Safe Harbor (Sliding Scale) Test
            </button>
            <button
              onClick={() => handleSelect("/test-general-safe-harbor")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              General Safe Harbor Test
            </button>
            <button
              onClick={() => handleSelect("/test-coverage")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Coverage Test
            </button>
            <button
              onClick={() => handleSelect("/test-top-heavy")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Top Heavy Test
            </button>
            <button
              onClick={() => handleSelect("/test-ratio-percentage")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Ratio Percentage Test
            </button>
            <button
              onClick={() => handleSelect("/test-acp")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              ACP Standard Test
            </button>
          </div>
        </div>

        {/* Cafeteria Plan Tests */}
        <div className="mb-8">
          <h4 className="text-xl font-semibold text-gray-700 mb-3 text-center">
            Cafeteria Plan Tests
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-cafeteria-key-employee")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cafeteria Key Employee Test
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
            <button
              onClick={() => handleSelect("/test-simple-cafeteria-plan-eligibility")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              SIMPLE Cafeteria Plan Eligibility Test
            </button>
            <button
              onClick={() => handleSelect("/test-cafeteria-contributions-benefits")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cafeteria Contributions & Benefits Test
            </button>
          </div>
        </div>

        {/* Health FSA Tests */}
        <div className="mb-8">
          <h4 className="text-xl font-semibold text-gray-700 mb-3 text-center">
            Health FSA Tests
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-health-fsa-eligibility")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Health FSA Eligibility Test
            </button>
            <button
              onClick={() => handleSelect("/test-health-fsa-benefits")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Health FSA Benefits Test
            </button>
            <button
              onClick={() => handleSelect("/test-health-fsa-key-employee-concentration")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Health FSA Key Employee Concentration Test
            </button>
            <button
              onClick={() => handleSelect("/test-health-fsa-55-average-benefits")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Health FSA 55% Average Benefits Test
            </button>
          </div>
        </div>

        {/* Dependent Care Assistance Program (DCAP) Tests */}
        <div className="mb-8">
          <h4 className="text-xl font-semibold text-gray-700 mb-3 text-center">
            Dependent Care Assistance Program Tests
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
            <button
              onClick={() => handleSelect("/test-dcap-key-employee-concentration")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              DCAP Key Employee Concentration Test (&gt;25%)
            </button>
          </div>
        </div>

        {/* Health Reimbursement Arrangement (HRA) Tests */}
        <div className="mb-8">
          <h4 className="text-xl font-semibold text-gray-700 mb-3 text-center">
            Health Reimbursement Arrangement Tests
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-hra-eligibility")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              HRA Eligibility Test
            </button>
            <button
              onClick={() => handleSelect("/test-hra-benefits")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              HRA Benefits Test
            </button>
            <button
              onClick={() => handleSelect("/test-hra-55-average-benefits")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              HRA 55% Average Benefits Test
            </button>
            <button
              onClick={() => handleSelect("/test-hra-key-employee-concentration")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              HRA Key Employee Concentration Test
            </button>
            <button
              onClick={() => handleSelect("/test-hra-25-owner-rule")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              HRA 25% Owner Rule Test
            </button>
          </div>
        </div>

        {/* Safe Harbor Tests */}
        <div className="mb-8">
          <h4 className="text-xl font-semibold text-gray-700 mb-3 text-center">
            Safe Harbor Tests
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-safe-harbor")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Safe Harbor 401(k) Test
            </button>
            <button
              onClick={() => handleSelect("/test-safe-harbor-401k")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              SafeHarbor401k Test
            </button>
            <button
              onClick={() => handleSelect("/test-adp-safe-harbor-sliding")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              SafeHarbor Sliding Test
            </button>
          </div>
        </div>

        {/* Additional IRS NDTs */}
        <div className="mb-8">
          <h4 className="text-xl font-semibold text-gray-700 mb-3 text-center">
            Additional IRS NDTs
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSelect("/test-average-benefit")}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Average Benefit Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSelection;
