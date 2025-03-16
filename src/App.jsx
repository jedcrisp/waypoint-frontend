import { useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import TestSelection from "./pages/TestSelection";
import AdpTest from "./pages/AdpTest";
import ACPTest from "./pages/ACPTest";
import KeyEmployeeTest from "./pages/KeyEmployeeTest";
import EligibilityTest from "./pages/EligibilityTest";
import ClassificationTest from "./pages/ClassificationTest";
import BenefitTest from "./pages/BenefitTest";
import HealthFSAEligibilityTest from "./pages/HealthFSAEligibilityTest";
import HealthFSABenefitsTest from "./pages/HealthFSABenefitsTest";
import DCAPTests from "./pages/DCAPTests";
import ADPACPTests from "./pages/ADP-ACPTests";
import HealthTests from "./pages/HealthTests";
import CafeteriaTests from "./pages/CafeteriaTests";
import DCAPEligibilityTest from "./pages/DCAPEligibilityTest";
import DCAPOwnersTest from "./pages/DCAPOwnersTest";
import DCAP55BenefitsTest from "./pages/DCAP55BenefitsTest";
import DCAPContributionsTest from "./pages/DCAPContributionsTest";
import HRABenefitsTest from "./pages/HRABenefitsTest";
import HRAEligibilityTest from "./pages/HRAEligibilityTest";
import RunTests from "./pages/RunTests"; // Page to execute selected tests
import SignIn from "./pages/SignIn";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// ✅ Create a global context to store selected tests and uploaded CSV file
const TestContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [selectedTests, setSelectedTests] = useState([]); // Stores selected tests
  const [uploadedFile, setUploadedFile] = useState(null); // Stores uploaded CSV file

  const auth = getAuth();

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
            <Route path="/test-acp" element={<ACPTest />} />
            <Route path="/test-key-employee" element={<KeyEmployeeTest />} />
            <Route path="/test-eligibility" element={<EligibilityTest />} />
            <Route path="/test-classification" element={<ClassificationTest />} />
            <Route path="/test-benefit" element={<BenefitTest />} />
            <Route path="/test-health-fsa-eligibility" element={<HealthFSAEligibilityTest />} />
            <Route path="/test-health-fsa-benefits" element={<HealthFSABenefitsTest />} />
            <Route path="/dcap-tests" element={<DCAPTests />} />
            <Route path="/adp-acp-tests" element={<ADPACPTests />} />
            <Route path="/health-tests" element={<HealthTests />} />
            <Route path="/cafeteria-tests" element={<CafeteriaTests />} />
            <Route path="/test-dcap-eligibility" element={<DCAPEligibilityTest />} />
            <Route path="/test-dcap-owners" element={<DCAPOwnersTest />} />
            <Route path="/test-dcap-55-benefits" element={<DCAP55BenefitsTest />} />
            <Route path="/test-dcap-contributions" element={<DCAPContributionsTest />} />
            <Route path="/test-hra-benefits" element={<HRABenefitsTest />} />
            <Route path="/test-hra-eligibility" element={<HRAEligibilityTest />} />
            <Route path="/run-tests" element={<RunTests />} /> {/* ✅ Run multiple selected tests */}
          </Routes>
        </Router>
      </TestContext.Provider>
    </ErrorBoundary>
  );
}

export { TestContext };
export default App;
