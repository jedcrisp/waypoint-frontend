import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../firebase"; // Ensure firebase.js is in your src folder
import waypointlogo from '../assets/waypointlogo.png'; // Adjust the path as needed

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    setError("");
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0074d9", // Green background similar to the screenshot
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div style={{
        width: "400px",
        backgroundColor: "#fff", // White background for the form
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        padding: "2rem",
        textAlign: "center",
      }}>

        {/* Logo */}
<img 
  src={waypointlogo} 
  alt="Waypoint Logo" 
  style={{ 
    width: "300px", 
    margin: "0 auto 1rem", 
    display: "block" 
  }} 
/>
<h1
  style={{
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#333",
    margin: "0 0 1rem", // Remove top margin and keep bottom margin
  }}
>
  Log In To Continue
</h1>

        {user ? (
          <>
            <h2 style={{ color: "#333", marginBottom: "1rem" }}>Welcome, {user.email}!</h2>
            <button
              onClick={handleSignOut}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                borderRadius: "4px",
                backgroundColor: "#f44336", // Red for sign-out
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            {/* Email Input */}
            <div style={{ marginBottom: "1rem" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="USERNAME"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  fontSize: "1rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f9f9f9",
                }}
              />
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: "1rem" }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  fontSize: "1rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f9f9f9",
                }}
              />
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleSignIn}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                borderRadius: "4px",
                backgroundColor: "#0074d9", // Blue button
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Access Account
            </button>

            {/* Error Message */}
            {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default SignIn;
