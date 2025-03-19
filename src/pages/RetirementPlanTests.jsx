import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function RetirementPlanTests() {
  const navigate = useNavigate();

  // Navigate to the appropriate test page
  const navigateToTest = (testPage) => {
    navigate(testPage);
  };

  const tests = [
    {
      name: "ADP Standard Test",
      route: "/test-adp",
      description:
        "Ensures that the average deferral percentage for HCEs does not exceed that for NHCEs by more than a specified limit.",
    },
    {
      name: "ADP Safe Harbor Test",
      route: "/test-adp-safe-harbor",
      description:
        "Verifies that the plan meets Safe Harbor requirements for deferral percentages.",
    },
    {
      name: "ADP Safe Harbor (Sliding Scale) Test",
      route: "/test-adp-safe-harbor-sliding",
      description:
        "Applies a sliding scale to Safe Harbor requirements based on NHCE deferral percentages.",
    },
    {
      name: "Safe Harbor Test 401(k)",
      route: "/test-adp-safe-harbor-401k",
      description:
        "Checks if the plan qualifies for general Safe Harbor status by ensuring uniform contribution and eligibility criteria.",
    },
    {
      name: "Coverage Test",
      route: "/test-coverage",
      description:
        "Ensures that the plan covers a sufficient percentage of employees as required by IRS guidelines.",
    },
    {
      name: "Top Heavy Test",
      route: "/test-top-heavy",
      description:
        "Evaluates whether key employees hold more than 60% of the total plan assets.",
    },
    {
      name: "Ratio Percentage Test",
      route: "/test-ratio-percentage",
      description:
        "Compares the percentage of eligible NHCEs to HCEs to ensure non-discrimination.",
    },
    {
      name: "ACP Standard Test",
      route: "/test-acp-standard",
      description:
        "Ensures that the average contribution percentage for HCEs does not exceed that for NHCEs by more than a specified limit.",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16 px-6">
      <h1 className="text-5xl font-light text-[#0074d9] mb-8">
        401(k) & Retirement Plan NDTs
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl justify-center">
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
            <div className="mt-4">
              <ArrowRight
                className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
                onClick={() => navigateToTest(test.route)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
