import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

const AccountInfo = () => {
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    company: "",
    address: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      // Replace with real values as needed
      setUserInfo({
        firstName: "",
        lastName: "",
        company: "",
        address: "",
        email: user.email,
        phone: "",
      });
    } else {
      setError("User not logged in.");
    }

    setLoading(false);
  }, []);

  const handleChange = (field, value) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // TODO: Save to backend
    setSaved(true);
  };

  if (loading) return <div className="text-center mt-10">Loading account info...</div>;
  if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-700">👤 Account Info</h2>
      <div className="space-y-4 text-lg">
        {["firstName", "lastName", "company", "address", "email", "phone"].map((field) => (
          <div key={field}>
            <label className="block font-semibold text-gray-700 capitalize mb-1">
              {field === "email" ? "Email" : field.replace(/([A-Z])/g, " $1")}
            </label>
            <input
              type="text"
              value={userInfo[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
              disabled={field === "email"} // Optional: disable editing email
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Save Changes
      </button>

      {saved && (
        <p className="mt-4 text-green-600 font-medium">✅ Changes saved!</p>
      )}
    </div>
  );
};

export default AccountInfo;
