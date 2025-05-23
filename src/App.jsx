// src/App.jsx
import React, { useState, useEffect, createContext, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import Dashboard from "./pages/Dashboard";
import CSVBuilderWizard from "./components/CSVBuilderWizard";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import FAQ from "./pages/FAQ";
import Contact from "./components/Contact";
import About from "./pages/About";
import UploadButton from "./components/UploadButton";
import ReportPage from "./pages/ReportPage";
import TestSelection from "./pages/TestSelection";
import CartPage from "./pages/CartPage";
import CheckoutButton from "./components/CheckoutButton";
import AdpTest from "./pages/AdpTest";
import ADPSafeHarbor401kTest from "./pages/ADPSafeHarbor401kTest";
import ADPSafeHarborSlidingTest from "./pages/ADPSafeHarborSlidingTest";
import ACPTest from "./pages/ACPTest";
import CafeteriaKeyEmployeeTest from "./pages/CafeteriaKeyEmployeeTest";
import EligibilityTest from "./pages/EligibilityTest";
import ClassificationTest from "./pages/ClassificationTest";
import BenefitTest from "./pages/BenefitTest";
import HealthFSAEligibilityTest from "./pages/HealthFSAEligibilityTest";
import HealthFSABenefitsTest from "./pages/HealthFSABenefitsTest";
import DCAPTests from "./pages/DCAPTests";
import HealthFSATests from "./pages/HealthFSATests";
import CafeteriaTests from "./pages/CafeteriaTests";
import DCAPEligibilityTest from "./pages/DCAPEligibilityTest";
import DCAPOwnersTest from "./pages/DCAPOwnersTest";
import DCAP55BenefitsTest from "./pages/DCAP55BenefitsTest";
import DCAPContributionsTest from "./pages/DCAPContributionsTest";
import HRABenefitsTest from "./pages/HRABenefitsTest";
import HRAEligibilityTest from "./pages/HRAEligibilityTest";
import SafeHarborTest from "./pages/SafeHarborTest";
import RunTests from "./pages/RunTests";
import SignIn from "./pages/SignIn";
import HRAKeyEmployeeConcentrationTest from "./pages/HRAKeyEmployeeConcentrationTest";
import CoverageTest from "./pages/CoverageTest";
import TopHeavyTest from "./pages/TopHeavyTest";
import RatioPercentageTest from "./pages/RatioPercentageTest";
import SimpleCafeteriaPlanEligibilityTest from "./pages/SimpleCafeteriaPlanEligibilityTest";
import CafeteriaContributionsBenefitsTest from "./pages/CafeteriaContributionsBenefitsTest";
import DCAPKeyEmployeeConcentrationTest from "./pages/DCAPKeyEmployeeConcentrationTest";
import HealthFSAKeyEmployeeConcentrationTest from "./pages/HealthFSAKeyEmployeeConcentrationTest";
import HealthFSA55AverageBenefitsTest from "./pages/HealthFSA55AverageBenefitsTest";
import HRA55AverageBenefitsTest from "./pages/HRA55AverageBenefitsTest";
import HRA25OwnerRuleTest from "./pages/HRA25OwnerRuleTest";
import AdditionalNDTTests from "./pages/AdditionalNDTTests";
import RetirementPlanTests from "./pages/RetirementPlanTests";
import HealthHRATests from "./pages/HealthHRATests";
import AverageBenefitTest from "./pages/AverageBenefitTest";
import AccountInfo from "./components/AccountInfo";
import Security from "./components/Security";
import TestHistory from "./components/TestHistory";

// Components
import Navbar from "./components/Navbar";
import ChatComponent from "./components/ChatComponent";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import "./index.css";

// Optional: a context for additional app-level state
const TestContext = createContext();

// Private route wrapper that checks if a user is authenticated
function PrivateRoute({ children }) {
  const auth = getAuth();
  const user = auth.currentUser;
  return user ? children : <Navigate to="/signin" />;
}

// Main application content wrapped with layout components
function AppContent() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [selectedTests, setSelectedTests] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const auth = getAuth();
  const timeoutRef = useRef(null);
  const location = useLocation();
  const [showChat, setShowChat] = useState(true);

  const subdomain = window.location.host.split('.')[0];
  const allowedDemoUser = "demo@onetrack-consulting.com";
  const isDemoSubdomain = subdomain === "demo";

  useEffect(() => {
    const hideChatOnRoutes = ["/signin", "/signup", "/account", "/security"];
    setShowChat(!hideChatOnRoutes.includes(location.pathname));
  }, [location.pathname]);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => signOut(auth), 300000);
  };

  useEffect(() => {
    window.addEventListener("mousemove", resetTimeout);
    window.addEventListener("keydown", resetTimeout);
    window.addEventListener("scroll", resetTimeout);
    resetTimeout();
    return () => {
      window.removeEventListener("mousemove", resetTimeout);
      window.removeEventListener("keydown", resetTimeout);
      window.removeEventListener("scroll", resetTimeout);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const isDemoUser = currentUser?.email === allowedDemoUser;
      if (isDemoSubdomain && !isDemoUser) {
        signOut(auth).then(() => {
          setUser(null);
          setLoadingAuth(false);
        });
      } else {
        setUser(currentUser);
        setLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [auth, isDemoSubdomain]);

  if (loadingAuth) return <div>Loading authentication...</div>;

  if (isDemoSubdomain && user && user.email !== allowedDemoUser) {
    return (
      <div className="text-center mt-20 text-red-600 text-xl">
        🚫 Access Denied: This subdomain is restricted to demo@onetrack-consulting.com.
      </div>
    );
  }

  const hideComponentsRoutes = ["/signin", "/signup"];
  const showComponents = !hideComponentsRoutes.includes(location.pathname);

  return (
    <TestContext.Provider
      value={{ selectedTests, setSelectedTests, uploadedFile, setUploadedFile }}
    >
      <div className="flex flex-col min-h-screen">
        {showComponents && <Navbar />}
        <main className="flex-grow">
          {showChat && <ChatComponent />}
          <UploadButton />
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/csv-builder" element={<CSVBuilderWizard />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/select-test" element={<PrivateRoute><TestSelection /></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
            <Route path="/checkout-button" element={<PrivateRoute><CheckoutButton /></PrivateRoute>} />
            <Route path="/test-adp" element={<PrivateRoute><AdpTest /></PrivateRoute>} />
            <Route path="/test-adp-safe-harbor-401k" element={<PrivateRoute><ADPSafeHarbor401kTest /></PrivateRoute>} />
            <Route path="/test-adp-safe-harbor-sliding" element={<PrivateRoute><ADPSafeHarborSlidingTest /></PrivateRoute>} />
            <Route path="/test-acp-standard" element={<PrivateRoute><ACPTest /></PrivateRoute>} />
            <Route path="/test-key-employee" element={<PrivateRoute><CafeteriaKeyEmployeeTest /></PrivateRoute>} />
            <Route path="/test-eligibility" element={<PrivateRoute><EligibilityTest /></PrivateRoute>} />
            <Route path="/test-classification" element={<PrivateRoute><ClassificationTest /></PrivateRoute>} />
            <Route path="/test-benefit" element={<PrivateRoute><BenefitTest /></PrivateRoute>} />
            <Route path="/test-health-fsa-eligibility" element={<PrivateRoute><HealthFSAEligibilityTest /></PrivateRoute>} />
            <Route path="/test-health-fsa-benefits" element={<PrivateRoute><HealthFSABenefitsTest /></PrivateRoute>} />
            <Route path="/dcap-tests" element={<PrivateRoute><DCAPTests /></PrivateRoute>} />
            <Route path="/health-fsa-tests" element={<PrivateRoute><HealthFSATests /></PrivateRoute>} />
            <Route path="/health-hra-tests" element={<PrivateRoute><HealthHRATests /></PrivateRoute>} />
            <Route path="/cafeteria-tests" element={<PrivateRoute><CafeteriaTests /></PrivateRoute>} />
            <Route path="/retirement-plan-tests" element={<PrivateRoute><RetirementPlanTests /></PrivateRoute>} />
            <Route path="/test-dcap-eligibility" element={<PrivateRoute><DCAPEligibilityTest /></PrivateRoute>} />
            <Route path="/test-dcap-owners" element={<PrivateRoute><DCAPOwnersTest /></PrivateRoute>} />
            <Route path="/test-dcap-55-benefits" element={<PrivateRoute><DCAP55BenefitsTest /></PrivateRoute>} />
            <Route path="/test-dcap-contributions" element={<PrivateRoute><DCAPContributionsTest /></PrivateRoute>} />
            <Route path="/test-hra-benefits" element={<PrivateRoute><HRABenefitsTest /></PrivateRoute>} />
            <Route path="/test-hra-eligibility" element={<PrivateRoute><HRAEligibilityTest /></PrivateRoute>} />
            <Route path="/test-adp-safe-harbor" element={<PrivateRoute><SafeHarborTest /></PrivateRoute>} />
            <Route path="/run-tests" element={<PrivateRoute><RunTests /></PrivateRoute>} />
            <Route path="/test-hra-key-employee-concentration" element={<PrivateRoute><HRAKeyEmployeeConcentrationTest /></PrivateRoute>} />
            <Route path="/test-coverage" element={<PrivateRoute><CoverageTest /></PrivateRoute>} />
            <Route path="/test-top-heavy" element={<PrivateRoute><TopHeavyTest /></PrivateRoute>} />
            <Route path="/test-ratio-percentage" element={<PrivateRoute><RatioPercentageTest /></PrivateRoute>} />
            <Route path="/test-simple-cafeteria-plan-eligibility" element={<PrivateRoute><SimpleCafeteriaPlanEligibilityTest /></PrivateRoute>} />
            <Route path="/test-cafeteria-contributions-benefits" element={<PrivateRoute><CafeteriaContributionsBenefitsTest /></PrivateRoute>} />
            <Route path="/test-dcap-key-employee-concentration" element={<PrivateRoute><DCAPKeyEmployeeConcentrationTest /></PrivateRoute>} />
            <Route path="/test-health-fsa-key-employee-concentration" element={<PrivateRoute><HealthFSAKeyEmployeeConcentrationTest /></PrivateRoute>} />
            <Route path="/test-health-fsa-55-average-benefits" element={<PrivateRoute><HealthFSA55AverageBenefitsTest /></PrivateRoute>} />
            <Route path="/test-hra-55-average-benefits" element={<PrivateRoute><HRA55AverageBenefitsTest /></PrivateRoute>} />
            <Route path="/test-hra-25-owner-rule" element={<PrivateRoute><HRA25OwnerRuleTest /></PrivateRoute>} />
            <Route path="/additional-ndt-tests" element={<PrivateRoute><AdditionalNDTTests /></PrivateRoute>} />
            <Route path="/test-average-benefit" element={<PrivateRoute><AverageBenefitTest /></PrivateRoute>} />
            <Route path="/report" element={<PrivateRoute><ReportPage /></PrivateRoute>} />
            <Route path="/account" element={<PrivateRoute><AccountInfo /></PrivateRoute>} />
            <Route path="/security" element={<PrivateRoute><Security /></PrivateRoute>} />
            <Route path="/test-history" element={<PrivateRoute><TestHistory /></PrivateRoute>} />
            <Route path="*" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/acpTest" element={<PrivateRoute><ACPTest /></PrivateRoute>} />
          </Routes>
        </main>
        {showComponents && <Footer />}
      </div>
    </TestContext.Provider>
  );
}

function App() {
  return (
  <AuthProvider>
    <CartProvider>
      <ErrorBoundary>
          <AppContent />
      </ErrorBoundary>
    </CartProvider>
  </AuthProvider>
  );
}

export { TestContext };
export default App;
