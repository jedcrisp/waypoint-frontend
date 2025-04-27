import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { enableNetwork } from "firebase/firestore";

const AccountInfo = () => {
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    company: "",
    address: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  // Detect if we're on the demo subdomain
  useEffect(() => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split(".")[0];
    setIsDemo(subdomain === "demo");
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      try {
        await enableNetwork(db);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserInfo({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            company: data.company || "",
            address: data.address || "",
            phone: data.phone || "",
            email: user.email,
          });
        } else {
          setUserInfo((prev) => ({
            ...prev,
            email: user.email,
          }));
        }
      } catch (err) {
        console.error("Error loading account info:", err);
        setError("Failed to load account info.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (field, value) => {
    if (isDemo) {
      setError("Editing account info is disabled in demo mode.");
      return;
    }
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (isDemo) {
      setError("Saving account info is disabled in demo mode.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("User not logged in.");
      return;
    }

    const userData = {
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      company: userInfo.company,
      address: userInfo.address,
      phone: userInfo.phone,
      email: userInfo.email,
    };

    try {
      console.log("Saving for user:", user.uid);
      console.log("User data:", userData);

      await setDoc(doc(db, "users", user.uid), userData, { merge: true });
      setSaved(true);
    } catch (err) {
      console.error("Failed writing to Firestore:", err.message);
      console.error("Error saving account info:", err);
      setError("Failed to save account info.");
    }
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
              disabled={field === "email" || isDemo} // Email is always disabled, other fields disabled in demo mode
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className={`mt-6 px-4 py-2 text-white rounded-md ${
          isDemo ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={isDemo}
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
