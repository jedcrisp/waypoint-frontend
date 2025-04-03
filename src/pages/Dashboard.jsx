import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, History, Shield, FileText, Info, BookOpen, Mail } from "lucide-react";
import { getAuth, updateProfile } from "firebase/auth";

const dashboardItems = [
  { title: "Account", route: "/account", description: "Manage your profile and settings", icon: User },
  { title: "Test History", route: "/test-history", description: "View saved and past test results", icon: History },
  { title: "Security", route: "/security", description: "Update password and secure your account", icon: Shield },
  { title: "Tests", route: "/home", description: "Start or continue available nondiscrimination tests", icon: FileText },
  { title: "About", route: "/about", description: "Learn more about this platform", icon: Info },
  { title: "Test Info", route: "/test-info", description: "Overview of test types and their use", icon: BookOpen },
  { title: "Contact", route: "/contact", description: "Get in touch with support", icon: Mail },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user && !user.displayName) {
      updateProfile(user, { displayName: "Jedidiah Crisp" })
        .then(() => {
          console.log("Display name updated!");
        })
        .catch((error) => {
          console.error("Error updating display name:", error);
        });
    }
  }, [user]);

  const displayName = user?.displayName || "User";

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Welcome back, {displayName} 👋</h1>
      <p className="text-gray-600 mb-6">Choose an option to get started.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
}
