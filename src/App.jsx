import React, { useState, useEffect, createContext, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Navbar from "./components/Navbar";
import ChatComponent from "./components/ChatComponent"; // Import Chat Component
import Home from "./pages/Home";
import TestSelection from "./pages/TestSelection";
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
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

const TestContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [selectedTests, setSelectedTests] = useState([]); // Stores selected tests
  const [uploadedFile, setUploadedFile] = useState(null); // Stores uploaded CSV file
  const auth = getAuth();
  const timeoutRef = useRef(null);

  // Function to reset the idle timeout timer
  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Set timeout for 5 minutes (300,000 milliseconds)
    timeoutRef.current = setTimeout(() => {
      signOut(auth);
    }, 300000);
  };

  // Set up activity event listeners to reset timeout
  useEffect(() => {
    window.addEventListener("mousemove", resetTimeout);
    window.addEventListener("keydown", resetTimeout);
    window.addEventListener("scroll", resetTimeout);

    // Initialize the timeout
    resetTimeout();

    return () => {
      window.removeEventListener("mousemove", resetTimeout);
      window.removeEventListener("keydown", resetTimeout);
      window.removeEventListener("scroll", resetTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [auth]);

  if (loadingAuth) return <div>Loading authentication...</div>;
  if (!user) return <SignIn />;

  return (
    <ErrorBoundary>
      <TestContext.Provider value={{ selectedTests, setSelectedTests, uploadedFile, setUploadedFile }}>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/select-test" element={<TestSelection />} />
            <Route path="/test-adp" element={<AdpTest />} />
            <Route path="/test-adp-safe-harbor-401k" element={<ADPSafeHarbor401kTest />} />
            <Route path="/test-adp-safe-harbor-sliding" element={<ADPSafeHarborSlidingTest />} />
            <Route path="/test-acp-standard" element={<ACPTest />} />
            <Route path="/test-key-employee" element={<CafeteriaKeyEmployeeTest />} />
            <Route path="/test-eligibility" element={<EligibilityTest />} />
            <Route path="/test-classification" element={<ClassificationTest />} />
            <Route path="/test-benefit" element={<BenefitTest />} />
            <Route path="/test-health-fsa-eligibility" element={<HealthFSAEligibilityTest />} />
            <Route path="/test-health-fsa-benefits" element={<HealthFSABenefitsTest />} />
            <Route path="/dcap-tests" element={<DCAPTests />} />
            <Route path="/health-fsa-tests" element={<HealthFSATests />} />
            <Route path="/health-hra-tests" element={<HealthHRATests />} />
            <Route path="/cafeteria-tests" element={<CafeteriaTests />} />
            <Route path="/retirement-plan-tests" element={<RetirementPlanTests />} />
            <Route path="/test-dcap-eligibility" element={<DCAPEligibilityTest />} />
            <Route path="/test-dcap-owners" element={<DCAPOwnersTest />} />
            <Route path="/test-dcap-55-benefits" element={<DCAP55BenefitsTest />} />
            <Route path="/test-dcap-contributions" element={<DCAPContributionsTest />} />
            <Route path="/test-hra-benefits" element={<HRABenefitsTest />} />
            <Route path="/test-hra-eligibility" element={<HRAEligibilityTest />} />
            <Route path="/test-adp-safe-harbor" element={<SafeHarborTest />} />
            <Route path="/run-tests" element={<RunTests />} />
            <Route path="/test-hra-key-employee-concentration" element={<HRAKeyEmployeeConcentrationTest />} />
            <Route path="/test-coverage" element={<CoverageTest />} />
            <Route path="/test-top-heavy" element={<TopHeavyTest />} />
            <Route path="/test-ratio-percentage" element={<RatioPercentageTest />} />
            <Route path="/test-simple-cafeteria-plan-eligibility" element={<SimpleCafeteriaPlanEligibilityTest />} />
            <Route path="/test-cafeteria-contributions-benefits" element={<CafeteriaContributionsBenefitsTest />} />
            <Route path="/test-dcap-key-employee-concentration" element={<DCAPKeyEmployeeConcentrationTest />} />
            <Route path="/test-health-fsa-key-employee-concentration" element={<HealthFSAKeyEmployeeConcentrationTest />} />
            <Route path="/test-health-fsa-55-average-benefits" element={<HealthFSA55AverageBenefitsTest />} />
            <Route path="/test-hra-55-average-benefits" element={<HRA55AverageBenefitsTest />} />
            <Route path="/test-hra-25-owner-rule" element={<HRA25OwnerRuleTest />} />
            <Route path="/additional-ndt-tests" element={<AdditionalNDTTests />} />
            <Route path="/test-average-benefit" element={<AverageBenefitTest />} />
          </Routes>
          
        </Router>
      </TestContext.Provider>
    </ErrorBoundary>
  );
}

export { TestContext };
export default App;
