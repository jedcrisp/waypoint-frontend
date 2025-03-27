import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  Feather,
  Eye,
  DollarSign,
  Wallet,
  Heart,
  Gavel,
} from "lucide-react";
import { TestContext } from "../App";

const Home = () => {
  const navigate = useNavigate();
  const { selectedTests, setSelectedTests } = useContext(TestContext);

  const navigateToSection = (route) => {
    navigate(route);
  };

  const sections = [
    {
      title: "Cafeteria Plan Testing",
      route: "/cafeteria-tests",
      icon: <Globe className="w-12 h-12 text-blue-600 mb-4" />,
    },
    {
      title: "Dependent Care Assistance Program (DCAP) Testing",
      route: "/dcap-tests",
      icon: <Feather className="w-12 h-12 text-blue-600 mb-4" />,
    },
    {
      title: "Health Flexible Spending Account (FSA) Testing",
      route: "/health-fsa-tests",
      icon: <Heart className="w-12 h-12 text-blue-600 mb-4" />,
    },
    {
      title: "Health Reimbursement Arrangement (HRA) Testing",
      route: "/health-hra-tests",
      icon: <Wallet className="w-12 h-12 text-blue-600 mb-4" />,
    },
    {
      title: "401(k) & Retirement Plan Testing",
      route: "/retirement-plan-tests",
      icon: <DollarSign className="w-12 h-12 text-blue-600 mb-4" />,
    },
    {
      title: "Additional IRS Testing",
      route: "/additional-ndt-tests",
      icon: <Gavel className="w-12 h-12 text-blue-600 mb-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0074d9] flex flex-col items-center py-16 px-6">
      <h1 className="text-5xl font-light text-white mb-4 text-center">
        Comprehensive NDT's
      </h1>
      <p className="text-lg text-white text-center max-w-2xl mb-8">
        Explore our full range of compliance tests. Click "View Tests" to see tests in each category.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-lg shadow p-8 flex flex-col items-center text-center h-full"
          >
            {section.icon}
            <h2 className="text-2xl font-semibold text-[#0074d9] mb-4">
              {section.title}
            </h2>
            <div className="flex-grow"></div>
            <button
              onClick={() => navigateToSection(section.route)}
              className="border border-gray-800 px-6 py-3 rounded hover:bg-gray-200 transition"
            >
              View Tests
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
