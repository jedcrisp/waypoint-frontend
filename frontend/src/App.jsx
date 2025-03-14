import { useState, useEffect } from "react";
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
import DCAPEligibilityTest from "./pages/DCAPEligibilityTest";
import DCAPOwnersTest from "./pages/DCAPOwnersTest";
import DCAP55BenefitsTest from "./pages/DCAP55BenefitsTest";
import DCAPContributionsTest from "./pages/DCAPContributionsTest";
import HRABenefitsTest from "./pages/HRABenefitsTest";
import HRAEligibilityTest from "./pages/HRAEligibilityTest";
import SignIn from "./pages/SignIn"; // A component you'll create for sign in
import "./index.css";

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    // Listen for changes to the user's sign-in state.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [auth]);

  if (loadingAuth) {
    return <div>Loading authentication...</div>;
  }

  // If no user is logged in, render the SignIn component.
  if (!user) {
    return <SignIn />;
  }

  return (
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
        <Route path="/test-dcap-eligibility" element={<DCAPEligibilityTest />} />
        <Route path="/test-dcap-owners" element={<DCAPOwnersTest />} />
        <Route path="/test-dcap-55-benefits" element={<DCAP55BenefitsTest />} />
        <Route path="/test-dcap-contributions" element={<DCAPContributionsTest />} />
        <Route path="/test-hra-benefits" element={<HRABenefitsTest />} />
        <Route path="/test-hra-eligibility" element={<HRAEligibilityTest />} />
      </Routes>
    </Router>
  );
}

export default App;
