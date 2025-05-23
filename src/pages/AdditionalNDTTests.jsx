import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function AdditionalNDTTests() {
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
      name: "ACP Standard Test",
      route: "/test-acp-standard",
      description:
        "Ensures that the average contribution percentage for HCEs does not exceed that for NHCEs by more than a specified limit.",
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
      name: "Average Benefit Test",
      route: "/test-average-benefit",
      description:
        "Ensures that the overall average benefits are calculated correctly and meet IRS non-discrimination requirements by comparing the average benefits between NHCEs and HCEs.",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16 px-6">
      <h1 className="text-5xl font-light text-[#0074d9] mb-8">
        Top 5 Non-Discrimination Tests
      </h1>
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
