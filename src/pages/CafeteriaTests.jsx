import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CafeteriaTests() {
  const navigate = useNavigate();

  const tests = [
    {
      name: "Key Employee Test",
      route: "/test-key-employee",
      description:
        "Ensures that Key Employees (owners, officers, or top earners) do not receive more than 25% of the total benefits under the Cafeteria Plan.",
    },
    {
      name: "Eligibility Test",
      route: "/test-eligibility",
      description:
        "Ensures that a sufficient percentage of non-highly compensated employees (NHCEs) are eligible to participate in the Cafeteria Plan.",
    },
    {
      name: "Classification Test",
      route: "/test-classification",
      description:
        "Ensures that the Cafeteria Plan’s eligibility rules do not unfairly favor Highly Compensated Employees (HCEs) or Key Employees over Non-Highly Compensated Employees (NHCEs).",
    },
    {
      name: "Benefit Test",
      route: "/test-benefit",
      description:
        "Ensures that benefits and employer contributions are distributed equitably and do not disproportionately favor HCEs or Key Employees.",
    },
    {
      name: "SIMPLE Cafeteria Plan Eligibility",
      route: "/test-simple-cafeteria-plan-eligibility",
      description:
        "Checks that the plan meets the eligibility criteria for a SIMPLE Cafeteria Plan, including required employee hours, earnings, and other criteria.",
    },
    {
      name: "Cafeteria Contributions & Benefits Test",
      route: "/test-cafeteria-contributions-benefits",
      description:
        "Verifies that employer and employee contributions, as well as benefits provided under the Cafeteria Plan, are non-discriminatory and equitable among employees.",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16 px-6">
      <h1 className="text-5xl font-light text-[#0074d9] mb-8">
        Cafeteria Plan Tests
      </h1>
      <p className="text-lg text-gray-700 text-center max-w-2xl mb-8">
        Assess Cafeteria Plan compliance with a comprehensive set of tests to ensure nondiscriminatory benefit offerings and alignment with IRS Section 125 regulations.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {tests.map((test) => (
          <div
            key={test.name}
            className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {test.name}
              </h2>
              <p className="text-gray-700 text-sm mt-4">{test.description}</p>
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
