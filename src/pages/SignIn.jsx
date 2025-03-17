// src/pages/SignIn.jsx
import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../firebase"; // Ensure firebase.js is in your src folder

const SignIn = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser);
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Function to sign in an existing user
  const handleSignIn = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in successfully");
    } catch (err) {
      console.error("Sign in error:", err);
      setError(err.message);
    }
  };

  // Function to register a new user
  const handleRegister = async () => {
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("User registered successfully");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
    }
  };

  // Function to sign out the current user
  const handleSignOut = async () => {
    setError("");
    try {
      await signOut(auth);
      console.log("User signed out successfully");
    } catch (err) {
      console.error("Sign out error:", err);
      setError(err.message);
    }
  };

  // Handle pressing Enter key in the form
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSignIn();
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "1.5rem", backgroundColor: "#d0074d9", padding: "2rem", borderRadius: "0.5rem" }}>
      {/* Banner */}
      <div style={{ backgroundColor: "#e0e0e0", padding: "1rem", marginBottom: "1rem", borderRadius: "0.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem", color: "#333" }}>
          Welcome to the Waypoint Non-Discrimination Testing Platform
        </h1>
      </div>
      <p style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#fff" }}>
        Authorized users, please sign-in below:
      </p>

      {user ? (
        <>
          <h2 style={{ color: "#fff" }}>Welcome, {user.email}!</h2>
          <button
            onClick={handleSignOut}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#f44336",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              marginTop: "1rem"
            }}
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <form onKeyDown={handleKeyDown} style={{ marginTop: "1rem" }}>
            <div style={{ margin: "0.5rem" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={{
                  padding: "0.5rem",
                  fontSize: "1rem",
                  width: "250px",
                  marginBottom: "0.5rem",
                  backgroundColor: "#333", // Darker background color
                  color: "#fff", // White text color
                  border: "1px solid #555", // Border color
                  borderRadius: "0.25rem" // Border radius
                }}
              />
            </div>
            <div style={{ margin: "0.5rem" }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                style={{
                  padding: "0.5rem",
                  fontSize: "1rem",
                  width: "250px",
                  marginBottom: "0.5rem",
                  backgroundColor: "#333", // Darker background color
                  color: "#fff", // White text color
                  border: "1px solid #555", // Border color
                  borderRadius: "0.25rem" // Border radius
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleSignIn}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#4285F4",
                color: "#fff",
                border: "none",
                cursor: "pointer"
              }}
            >
              Sign In
            </button>
          </form>
          {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
        </>
      )}
    </div>
  );
};

export default SignIn;