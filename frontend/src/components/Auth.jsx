import { useState, useEffect } from "react";
import { auth, provider, signInWithPopup, signOut } from "../firebase";

const Auth = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Google Sign-In Function
  const login = async () => {
    try {
      setError(null); // Clear any previous errors
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to sign in. Please try again.");
    }
  };

  // Logout Function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="text-center p-4 bg-white shadow-lg rounded-lg max-w-sm mx-auto">
      {user ? (
        <>
          <p className="text-lg font-semibold text-gray-700">
            Welcome, {user.displayName}!
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
            Sign in with Google
          </button>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </>
      )}
    </div>
  );
};

export default Auth;

