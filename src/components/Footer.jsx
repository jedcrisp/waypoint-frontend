// components/Footer.jsx
import { useState } from "react";

const Footer = () => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <>
      <footer className="w-full text-center py-4 border-t mt-8 text-sm text-gray-600 bg-gray-100">
        <p>
          © {new Date().getFullYear()} Waypoint. All rights reserved. ·{" "}
          <button
            onClick={() => setShowTermsModal(true)}
            className="text-blue-500 hover:underline"
          >
            Terms & Conditions
          </button>{" "}
          ·{" "}
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="text-blue-500 hover:underline"
          >
            Privacy Policy
          </button>
        </p>
      </footer>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-md w-full relative">
            <h2 className="text-lg font-semibold mb-2">Terms and Conditions</h2>
            <p className="text-sm text-gray-700 max-h-60 overflow-y-auto">
              By using this platform, you agree to use it responsibly and in accordance with all applicable laws.
              Your data will be handled according to our privacy policy. We may update these terms at any time.
            </p>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowTermsModal(false)}
            >
              ✕
            </button>
            <div className="mt-4 text-right">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setShowTermsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-md w-full relative">
            <h2 className="text-lg font-semibold mb-2">Privacy Policy</h2>
            <div className="text-sm text-gray-700 max-h-60 overflow-y-auto space-y-2">
              <p>
                We value your privacy and take the protection of your data seriously. This application collects only the information
                necessary to run required non-discrimination testing tools for your organization.
              </p>
              <p>
                Data may include employee information such as compensation, service dates, and eligibility for benefit plans.
                This data is used strictly for compliance testing and reporting purposes and is never shared with third parties without your consent.
              </p>
              <p>
                Our systems are secured with modern encryption and hosted in reputable, secure cloud environments. Users may request deletion of their data at any time.
              </p>
              <p>
                For any questions or data-related concerns, please contact info@onetrack-consulting.com.
              </p>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowPrivacyModal(false)}
            >
              ✕
            </button>
            <div className="mt-4 text-right">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setShowPrivacyModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
