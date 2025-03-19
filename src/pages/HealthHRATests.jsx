import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function HealthHRATests() {
  const navigate = useNavigate();

  const tests = [
    {
      name: "HRA Eligibility Test",
      route: "/test-hra-eligibility",
      description:
        "Ensures that a sufficient percentage of non-highly compensated employees (NHCEs) are eligible to participate in the HRA.",
    },
    {
      name: "HRA Benefits Test",
      route: "/test-hra-benefits",
      description:
        "Verifies that HRA benefits are distributed equitably among employees.",
    },
    {
      name: "HRA 55% Average Benefits Test",
      route: "/test-hra-55-average-benefits",
      description:
        "Ensures that the average HRA benefit for NHCEs is at least 55% of that for HCEs.",
    },
    {
      name: "HRA Key Employee Concentration Test",
      route: "/test-hra-key-employee-concentration",
      description:
        "Checks that key employee HRA benefits do not exceed 25% of total HRA benefits.",
    },
    {
      name: "HRA 25% Owner Rule Test",
      route: "/test-hra-25-owner-rule",
      description:
        "Ensures that benefits attributed to owners do not exceed 25% of total HRA benefits.",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16 px-6">
      <h1 className="text-5xl font-light text-[#0074d9] mb-8 text-center">
        Health Reimbursement Arrangement (HRA) Tests
      </h1>
      <p className="text-lg text-gray-700 text-center max-w-2xl mb-8">
        Explore the various HRA compliance tests to ensure equitable benefit distribution and adherence to IRS regulations.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
        {tests.map((test) => (
          <div
            key={test.name}
            className="bg-gray-100 rounded-lg shadow p-8 flex flex-col justify-between items-center text-center"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {test.name}
            </h2>
            <p className="text-gray-700 text-sm mb-6">{test.description}</p>
            <button
              onClick={() => navigate(test.route)}
              className="mt-4 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center"
            >
              <ArrowRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
