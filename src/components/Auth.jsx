// src/components/Auth.jsx
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase"; // Note: No "provider" here

const Auth = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    setError(null);
    try {
      // Replace these with actual user inputs
      const email = "user@example.com";
      const password = "userPassword";
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in:", userCredential.user);
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in. Please try again.");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="text-center p-4 bg-white shadow-lg rounded-lg max-w-sm mx-auto">
      {user ? (
        <>
          <p className="text-lg font-semibold text-gray-700">
            Welcome, {user.email}!
          </p>
          <button
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            onClick={logout}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={login}
          >
            Sign in with Email & Password
          </button>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </>
      )}
    </div>
  );
};

export default Auth;
