import React from "react";

const FAQ = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📘 Frequently Asked Questions</h1>

      {/* General Questions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">🔍 General Questions</h2>
        <ul className="space-y-4">
          <li>
            <strong>Q1: What is nondiscrimination testing (NDT)?</strong>
            <p className="text-gray-700">
              A: Nondiscrimination testing ensures that employee benefit plans—like 401(k), cafeteria plans, or health plans—do not unfairly favor highly compensated or key employees over others, per IRS regulations.
            </p>
          </li>
          <li>
            <strong>Q2: Who is required to conduct NDT?</strong>
            <p className="text-gray-700">
              A: Any employer offering benefit plans like 401(k), Section 125 cafeteria plans, FSAs, or DCAPs is required to perform annual nondiscrimination testing.
            </p>
          </li>
          <li>
            <strong>Q3: What happens if a plan fails NDT?</strong>
            <p className="text-gray-700">
              A: If a plan fails, corrective actions may include returning contributions, making additional employer contributions, or plan redesign. Penalties and tax consequences can also occur.
            </p>
          </li>
          <li>
            <strong>Q4: How often should testing be done?</strong>
            <p className="text-gray-700">
              A: Testing should be conducted annually, though many companies run preliminary tests mid-year to allow time for corrections.
            </p>
          </li>
        </ul>
      </section>

      {/* Platform Usage */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-green-700 mb-4">💻 Platform Usage</h2>
        <ul className="space-y-4">
          <li>
            <strong>Q5: What benefit plans can I test with this platform?</strong>
            <p className="text-gray-700">
              A: Our platform supports testing for 401(k), 403(b), Section 125 plans (cafeteria, FSA, HSA), dependent care assistance, and self-insured health plans.
            </p>
          </li>
          <li>
            <strong>Q6: How do I upload employee data?</strong>
            <p className="text-gray-700">
              A: You can upload data via our CSV template provided within the platform.
            </p>
          </li>
          <li>
            <strong>Q7: Is my data secure?</strong>
            <p className="text-gray-700">
              A: Yes. We use industry-standard encryption, multi-factor authentication, and regular audits to keep your information safe and compliant.
            </p>
          </li>
          <li>
            <strong>Q8: Can I run multiple tests in one year?</strong>
            <p className="text-gray-700">
              A: Absolutely. You can run unlimited tests—ideal for mid-year check-ins and year-end compliance.
            </p>
          </li>
        </ul>
      </section>

      {/* Technical & Support */}
      <section className="mb-4">
        <h2 className="text-xl font-semibold text-red-700 mb-4">🛠️ Technical & Support</h2>
        <ul className="space-y-4">
          <li>
            <strong>Q9: Who do I contact for support?</strong>
            <p className="text-gray-700">
              A: Our support team is available via chat, email, or phone Monday through Friday. You can also open a ticket directly within your dashboard.
            </p>
          </li>
          <li>
            <strong>Q10: Can I generate reports for auditors or IRS submission?</strong>
            <p className="text-gray-700">
              A: Yes, downloadable reports are available in PDF and CSV format, structured to meet audit and IRS documentation standards.
            </p>
          </li>
        </ul>
      </section>

      {/* Submit Ticket CTA */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-gray-800">
          Still have questions?{' '}
          <a href="mailto:info@onetrack-consulting.com" className="text-blue-700 font-medium hover:underline">
           Please reach out to info@onetrack-consulting.com
          </a>
          , and our support team will get back to you promptly.
        </p>
      </div>
    </div>
  );
};

export default FAQ;
