// src/pages/Dashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, History, Shield, FileText, Info, BookOpen, Mail, FileCog } from "lucide-react";
import { getAuth } from "firebase/auth";
import { useTests } from "../hooks/useTests";
import YourTests from "./YourTests"; // Adjust the import path if needed

const dashboardItems = [
  { title: "Account", route: "/account", description: "Manage your profile and settings", icon: User },
  { title: "Tests", route: "/home", description: "Start or continue available nondiscrimination tests", icon: FileText },
  { title: "Test History", route: "/test-history", description: "View saved and past test results", icon: History },
  //{ title: "Test Info", route: "/test-info", description: "Overview of test types and their use", icon: BookOpen },
  { title: "CSV Builder", route: "/csv-builder", description: "Map and export formatted CSVs for tests", icon: FileCog },
  { title: "About", route: "/about", description: "Learn more about this platform", icon: Info },
  { title: "Security", route: "/security", description: "Update password and secure your account", icon: Shield },
  //{ title: "Contact", route: "/contact", description: "Get in touch with support", icon: Mail },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const displayName = user?.displayName || "User";

  // Fetch all available tests using the custom hook.
  const { tests, loading } = useTests();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Welcome back, {displayName} 👋</h1>
      <p className="text-gray-600 mb-6">Choose an option to get started.</p>

      {/* Dashboard Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {dashboardItems.map(({ title, route, description, icon: Icon }) => (
          <motion.div
            key={title}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(route)}
            className="cursor-pointer rounded-2xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 p-6 bg-white flex flex-col items-start space-y-2"
          >
            <Icon className="w-6 h-6 text-gray-700 mb-1" />
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-gray-600">{description}</p>
          </motion.div>
        ))}
      </div>

      {/* Purchased Tests Section */}
      {loading ? (
        <div>Loading your tests...</div>
      ) : (
        // Pass user.uid and the full list of tests to YourTests
        <YourTests userId={user?.uid} allTests={tests} />
      )}
    </div>
  );
}
