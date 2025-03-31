import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../firebase";
import waypointlogo from "../assets/waypointlogo.png";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0074d9",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div style={{
        width: "400px",
        backgroundColor: "#fff",
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
        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "#333",
          margin: "0 0 1rem",
        }}>
          Log In To Continue
        </h1>
        {user ? (
          <h2 style={{ color: "#333", marginBottom: "1rem" }}>
            Welcome, {user.email}!
          </h2>
        ) : (
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
            {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export default SignIn;
