import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function HealthFSATests() {
  const navigate = useNavigate();

  const tests = [
    {
      name: "Health FSA Eligibility Test",
      route: "/test-health-fsa-eligibility",
      description:
        "Ensures that a sufficient percentage of non-highly compensated employees (NHCEs) are eligible to participate in the Health FSA.",
    },
    {
      name: "Health FSA Benefits Test",
      route: "/test-health-fsa-benefits",
      description:
        "Ensures that benefits and employer contributions are not disproportionately favoring Highly Compensated Individuals (HCIs).",
    },
    {
      name: "Health FSA Key Employee Concentration Test",
      route: "/test-health-fsa-key-employee-concentration",
      description:
        "Checks that Health FSA benefits are not overly concentrated among key employees.",
    },
    {
      name: "Health FSA 55% Average Benefits Test",
      route: "/test-health-fsa-55-average-benefits",
      description:
        "Ensures that the average benefit for non-highly compensated employees is at least 55% of that for highly compensated employees.",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16 px-6">
      <h1 className="text-5xl font-light text-[#0074d9] mb-8">
        Health FSA Tests
      </h1>
      <p className="text-lg text-gray-700 text-center max-w-2xl mb-8">
        Evaluate Flexible Spending Account (FSA) compliance through targeted tests designed to ensure nondiscriminatory benefit distribution and adherence to IRS FSA regulations.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 w-full max-w-7xl">
        {tests.map((test) => (
          <div
            key={test.name}
            className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {test.name}
              </h2>
              <p className="text-gray-700 text-sm mt-4">
                {test.description}
              </p>
            </div>
            <div className="mt-auto">
              <ArrowRight
                className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
                onClick={() => navigate(test.route)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
