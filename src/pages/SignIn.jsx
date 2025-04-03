import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import waypointlogo from "../assets/waypointlogo.png";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Listen for auth state changes; if the user is already signed in, redirect to dashboard.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        navigate("/dashboard"); // redirect to dashboard after successful login
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Explicitly navigate to dashboard after login.
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0074d9",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "400px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <img
          src={waypointlogo}
          alt="Waypoint Logo"
          style={{ width: "300px", margin: "0 auto 1rem", display: "block" }}
        />
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#333",
            margin: "0 0 1rem",
          }}
        >
          Log In To Continue
        </h1>
        {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
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
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "1rem",
              borderRadius: "4px",
              backgroundColor: "#0074d9",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Access Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
