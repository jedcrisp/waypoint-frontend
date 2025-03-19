// src/pages/SignIn.jsx
import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../firebase"; // Ensure firebase.js is in your src folder
import logo from '../assets/logo.png'; // Adjust the path as needed

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
    <div style={{ minHeight: "100vh", backgroundColor: "#0074d9", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", padding: "2rem", borderRadius: "0.5rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Logo */}
        <img src={logo} alt="Sign-in Logo" style={{ width: "350px", marginBottom: "1rem" }} />
        
        {/* Banner */}
        <h1 style={{ margin: 0, fontSize: "3.75rem", color: "#fff" }}>
          Welcome to Waypoint
        </h1>
        <p style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#fff" }}>
          A Non-Discrimination Testing Platform
        </p>
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
                fontSize: "1.25rem",
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
            <form onKeyDown={handleKeyDown} style={{ marginTop: "0.5rem" }}>
              <div style={{ margin: "0.5rem" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  style={{
                    padding: "0.5rem",
                    fontSize: "1.25rem",
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
                    fontSize: "1.25rem",
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
                  backgroundColor: "#888888", // Mid-point gray background color
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
    </div>
  );
};

export default SignIn;