import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { TestContext } from "../App";
import { Globe, Feather, Eye, DollarSign } from "lucide-react";
import CsvTemplateDownloader from "../components/CsvTemplateDownloader"; // Adjust the path as needed

export default function Home() {
  const { selectedTests, setSelectedTests } = useContext(TestContext);
  const navigate = useNavigate();

  // Toggle test selection
  const toggleTestSelection = (testName) => {
    setSelectedTests([testName]);
  };

  // Navigate to the appropriate test page
  const navigateToTest = (testPage) => {
    navigate(testPage);
  };

  return (
    <div className="min-h-screen bg-[#0074d9] flex flex-col items-center py-16 px-6">
      {/* Title Section */}
      <h1 className="text-5xl font-light text-white mb-4 text-center">Comprehensive NDT's</h1>
      <p className="text-lg text-white text-center max-w-2xl mb-8">
        Explore our full range of compliance tests. Click 'View Tests' to learn more about each test and its details.
      </p>

      {/* Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 w-full max-w-7xl">
        
        {/* Cafeteria Plan */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center">
          <div className="flex flex-col items-center">
            <Globe className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Cafeteria Plan</h2>
            <ul className="text-gray-700 text-sm text-center my-4 space-y-1">
              {["Key Employee Test", "Eligibility Test", "Classification Test", "Benefit Test"].map((test) => (
                <li 
                  key={test} 
                  className="cursor-pointer hover:underline" 
                  onClick={() => navigateToTest(`/cafeteria-tests/${test.toLowerCase().replace(/ /g, "-")}`)}
                >
                  {test}
                </li>
              ))}
            </ul>
          </div>
          <button 
            className="border border-gray-800 px-6 py-4 rounded hover:bg-gray-200 transition h-12 flex items-center justify-center mt-auto w-full"
            onClick={() => navigateToTest("/cafeteria-tests")}
          >
            View Tests
          </button>
        </div>

        {/* Dependent Care Assistance Program */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center">
          <div className="flex flex-col items-center">
            <Feather className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 text-center">Dependent Care Assistance Program</h2>
            <ul className="text-gray-700 text-sm text-center my-4 space-y-1">
              {["DCAP Eligibility", "DCAP Owners", "DCAP 55 Benefits", "DCAP Contributions"].map((test) => (
                <li 
                  key={test} 
                  className="cursor-pointer hover:underline" 
                  onClick={() => navigateToTest(`/dcap-tests/${test.toLowerCase().replace(/ /g, "-")}`)}
                >
                  {test}
                </li>
              ))}
            </ul>
          </div>
          <button 
            className="border border-gray-800 px-6 py-3 rounded hover:bg-gray-200 transition h-12 flex items-center justify-center w-full"
            onClick={() => navigateToTest("/dcap-tests")}
          >
            View Tests
          </button>
        </div>

        {/* Health FSA, HRA & Self Insured Medical Plans */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center">
          <div className="flex flex-col items-center">
            <Eye className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 text-center">
              Health FSA, HRA & Self Insured Medical Plans
            </h2>
            <ul className="text-gray-700 text-sm text-center my-4 space-y-1">
              {["Health FSA Eligibility", "Health FSA Benefits", "HRA Eligibility", "HRA Benefits"].map((test) => (
                <li 
                  key={test} 
                  className="cursor-pointer hover:underline" 
                  onClick={() => navigateToTest(`/health-tests/${test.toLowerCase().replace(/ /g, "-")}`)}
                >
                  {test}
                </li>
              ))}
            </ul>
          </div>
          <button 
            className="border border-gray-800 px-6 py-3 rounded hover:bg-gray-200 transition h-12 flex items-center justify-center w-full"
            onClick={() => navigateToTest("/health-tests")}
          >
            View Tests
          </button>
        </div>

        {/* ADP & ACP */}
        <div className="bg-gray-100 rounded-lg shadow p-8 flex flex-col h-full justify-between items-center">
          <div className="flex flex-col items-center">
            <DollarSign className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">ADP & ACP</h2>
            <ul className="text-gray-700 text-sm text-center my-4 space-y-1">
              {["ADP Test", "ACP Test"].map((test) => (
                <li 
                  key={test} 
                  className="cursor-pointer hover:underline" 
                  onClick={() => navigateToTest(`/adp-acp-tests/${test.toLowerCase().replace(/ /g, "-")}`)}
                >
                  {test}
                </li>
              ))}
            </ul>
          </div>
          <button 
            className="border border-gray-800 px-6 py-3 rounded hover:bg-gray-200 transition h-12 flex items-center justify-center w-full"
            onClick={() => navigateToTest("/adp-acp-tests")}
          >
            View Tests
          </button>
        </div>

      </div>

    </div>
  );
}