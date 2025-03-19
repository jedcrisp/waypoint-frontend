import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function AdditionalNDTTests() {
  const navigate = useNavigate();

  // Navigate to the appropriate test page
  const navigateToTest = (testPage) => {
    navigate(testPage);
  };

  const test = [
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
        Additional Non-Discrimination Tests
      </h1>
      <div className="grid grid-cols-1 gap-6 w-full max-w-7xl">
        {test.map((t, index) => (
          <div
            key={index}
            className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center text-center"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t.name}</h2>
              <p className="text-gray-700 text-sm mt-4">{t.description}</p>
            </div>
            <div className="mt-auto">
              <ArrowRight
                className="w-10 h-10 text-gray-700 cursor-pointer transition-transform transform hover:translate-x-1"
                onClick={() => navigateToTest(t.route)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdditionalNDTTests;