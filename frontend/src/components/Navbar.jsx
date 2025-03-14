// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase"; // Adjust the path if needed

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to home after sign out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white shadow-md py-4 px-8 flex justify-between items-center">
      <h1 className="text-lg font-semibold text-gray-700">
        Waypoint, The All-In-One Non-Discriminatory Testing Application
      </h1>
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-gray-600 hover:text-blue-600">
          Home
        </Link>
        <Link to="/select-test" className="text-gray-600 hover:text-blue-600">
          Choose a Test
        </Link>
        {user && (
          <button
            onClick={handleSignOut}
            className="text-gray-600 hover:text-blue-600"
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}
