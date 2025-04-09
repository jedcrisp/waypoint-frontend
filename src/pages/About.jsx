import React from "react";

const About = () => {
  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg border border-gray-200">
      <h1 className="text-3xl font-bold text-purple-700 mb-4">📘 About Waypoint</h1>
      <p className="text-gray-700 mb-4">
        <strong>Waypoint by OneTrack Consulting</strong> is your trusted partner in nondiscrimination testing and compliance.
        Our platform is designed to simplify and streamline benefit plan testing, ensuring your organization meets all IRS and ERISA requirements with confidence.
      </p>

      <p className="text-gray-700 mb-4">
        We proudly offer <strong>29 comprehensive Nondiscrimination Tests</strong>, covering a wide range of benefit plans, including:
      </p>

      <ul className="list-disc list-inside text-gray-700 mb-4">
        <li>401(k) and 403(b) Retirement Plans</li>
        <li>Section 125 Cafeteria Plans</li>
        <li>Flexible Spending Accounts (FSAs)</li>
        <li>Dependent Care Assistance Programs (DCAPs)</li>
        <li>Health Reimbursement Arrangements (HRAs)</li>
        <li>…and many more.</li>
      </ul>

      <p className="text-gray-700">
        Whether you're an HR professional, plan administrator, or compliance consultant,
        <strong> Waypoint equips you with the tools, insights, and automation</strong> to analyze, report, and comply—without the complexity.
      </p>
    </div>
  );
};

export default About;