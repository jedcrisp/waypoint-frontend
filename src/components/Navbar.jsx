import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase"; // Adjust the path if needed
import { ArrowLeft } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Handle sign-out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Optionally redirect after sign out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Determine navbar background color and text color based on the current route
  const isSpecialTestPage = location.pathname.includes("/dcap-tests") || location.pathname.includes("/test-dcap-eligibility") || location.pathname.includes("/test-dcap-owners") || location.pathname.includes("/test-dcap-55-benefits") || location.pathname.includes("/test-dcap-contributions") || location.pathname.includes("/adp-acp-tests") || location.pathname.includes("/health-tests") || location.pathname.includes("/cafeteria-tests") || location.pathname.includes("/test-adp") || location.pathname.includes("/test-acp") || location.pathname.includes("/test-key-employee") || location.pathname.includes("/test-eligibility") || location.pathname.includes("/test-classification") || location.pathname.includes("/test-benefit") || location.pathname.includes("/test-health-fsa-eligibility") || location.pathname.includes("/test-health-fsa-benefits") || location.pathname.includes("/test-hra-eligibility") || location.pathname.includes("/test-hra-benefits");
  const navbarBgColor = isSpecialTestPage ? "#0074d9" : "white";
  const textColor = isSpecialTestPage ? "text-white" : "text-black";

  return (
    <nav className="shadow-md py-4 px-8 flex justify-between items-center relative" style={{ backgroundColor: navbarBgColor }}>
      {/* Left: Waypoint Logo */}
      <h1 className={`text-lg font-semibold cursor-pointer hover:text-gray-700 ${textColor}`} onClick={() => navigate("/")}>
        Waypoint
      </h1>

      {/* Center: Back Button - Only on Special Test pages */}
      {isSpecialTestPage && (
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <button className={`text-white hover:text-black flex items-center ${textColor}`} onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>
      )}

      {/* Right: Sign Out */}
      <div className="flex items-center space-x-4">
        {user && (
          <button onClick={handleSignOut} className={`hover:text-gray-700 ${textColor}`}>
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}
