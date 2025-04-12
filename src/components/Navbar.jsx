import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase"; // Adjust the path if needed
import { useCart } from "../contexts/CartContext";
import { ArrowLeft, ShoppingCart, LayoutDashboard, LogOut } from "lucide-react";
  
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
  
  // Get cart data from CartContext
  const { cartItems } = useCart();
  
  // Determine if the current route qualifies as a special test page.
  const isSpecialTestPage =
    location.pathname.includes("/account") ||
    location.pathname.includes("/csv-builder") ||
    location.pathname.includes("/contact") ||
    location.pathname.includes("/about") ||
    location.pathname.includes("/faq") ||
    location.pathname.includes("/dashboard") ||
    location.pathname.includes("/unauthorized") ||
    location.pathname.includes("/cart") ||
    location.pathname.includes("/security") ||
    location.pathname.includes("/test-history") ||
    location.pathname.includes("/dcap-tests") ||
    location.pathname.includes("/additional-ndt-tests") ||
    location.pathname.includes("/retirement-plan-tests") ||
    location.pathname.includes("/adp-acp-tests") ||
    location.pathname.includes("/health-fsa-tests") ||
    location.pathname.includes("/cafeteria-tests") ||
    location.pathname.includes("/health-hra-tests") ||
    location.pathname.includes("/test-adp") ||
    location.pathname.includes("/test-acp") ||
    location.pathname.includes("/test-coverage") ||
    location.pathname.includes("/test-top-heavy") ||
    location.pathname.includes("/test-adp-safe-harbor-401k") ||
    location.pathname.includes("/test-adp-safe-harbor-sliding") ||
    location.pathname.includes("/test-safe-harbor") ||
    location.pathname.includes("/test-ratio-percentage") ||
    location.pathname.includes("/test-dcap-eligibility") ||
    location.pathname.includes("/test-dcap-owners") ||
    location.pathname.includes("/test-dcap-55-benefits") ||
    location.pathname.includes("/test-dcap-contributions") ||
    location.pathname.includes("/test-dcap-key-employee-concentration") ||
    location.pathname.includes("/test-dcap-employee-concentration") ||
    location.pathname.includes("/test-key-employee") ||
    location.pathname.includes("/test-eligibility") ||
    location.pathname.includes("/test-classification") ||
    location.pathname.includes("/test-benefit") ||
    location.pathname.includes("/test-simple-cafeteria-plan-eligibility") ||
    location.pathname.includes("/test-cafeteria-contributions-benefits") ||
    location.pathname.includes("/test-health-fsa-eligibility") ||
    location.pathname.includes("/test-health-fsa-benefits") ||
    location.pathname.includes("/test-health-fsa-key-employee-concentration") ||
    location.pathname.includes("/test-health-fsa-55-average-benefits") ||
    location.pathname.includes("/test-hra-eligibility") ||
    location.pathname.includes("/test-hra-benefits") ||
    location.pathname.includes("/test-hra-55-average-benefits") ||
    location.pathname.includes("/test-hra-key-employee-concentration") ||
    location.pathname.includes("/test-hra-25-owner-rule") ||
    location.pathname.includes("/test-adp-safe-harbor") ||
    location.pathname.includes("/test-average-benefit");
  
  const navbarBgColor = isSpecialTestPage ? "#0074d9" : "white";
  const textColor = isSpecialTestPage ? "text-white" : "text-black";
  
  // Show the back button only if on a special page and not on the dashboard route
  const showBackButton = isSpecialTestPage && !location.pathname.startsWith("/dashboard");
  
  return (
    <nav
      className="shadow-md py-4 px-8 flex justify-between items-center relative"
      style={{ backgroundColor: navbarBgColor }}
    >
      {/* Left: Waypoint Logo */}
      <h1 className={`text-lg font-semibold ${textColor}`}>
        Waypoint
      </h1>
  
      {/* Center: Back Button (if applicable) */}
      {showBackButton && (
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <button
            className={`flex items-center ${textColor} hover:text-black`}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>
      )}
  
      {/* Right: Dashboard, Cart, and Sign Out */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex items-center ${textColor} hover:text-gray-300`}
        >
          <LayoutDashboard className="w-5 h-5 mr-1" />
        </button>
        <button
          onClick={() => navigate("/cart")}
          className={`relative flex items-center ${textColor} hover:text-gray-300`}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </button>
        <button
          onClick={handleSignOut}
          className={`flex items-center ${textColor} hover:text-gray-300`}
        >
          <LogOut className="w-5 h-5 mr-1" />
        </button>
      </div>
    </nav>
  );
}
