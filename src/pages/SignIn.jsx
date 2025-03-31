import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { auth } from "../firebase";
import waypointlogo from '../assets/waypointlogo.png';

const db = getFirestore();

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setCheckingAccess(true);

      if (!currentUser) {
        setUser(null);
        setCheckingAccess(false);
        return;
      }

      try {
        const token = await currentUser.getIdToken(true);
        const host = window.location.hostname;
        const subdomain = host.includes("localhost")
          ? "healthequity" // change for local testing
          : host.split(".")[0];

        const docRef = doc(db, "clientPortals", subdomain);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("❌ This portal is not set up.");
          await signOut(auth);
          setUser(null);
        } else {
          const allowedUsers = docSnap.data().allowedUsers || [];
          const normalizedAllowed = allowedUsers.map(e => e.toLowerCase().trim());
          const normalizedEmail = currentUser.email.toLowerCase().trim();

          if (!normalizedAllowed.includes(normalizedEmail)) {
            setError("❌ You are not authorized to access this portal.");
            await signOut(auth);
            setUser(null);
          } else {
            setUser(currentUser);
          }
        }
      } catch (err) {
        console.error("Access check error:", err);
        setError("⚠️ Failed to verify access.");
        await signOut(auth);
        setUser(null);
      }

      setCheckingAccess(false);
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

  const handleSignOut = async () => {
    setError("");
    try {
      await signOut(auth);
      setUser(null);
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
            margin: "0 0 1rem",
          }}
        >
          Log In To Continue
        </h1>

        {checkingAccess ? (
          <p>Checking access...</p>
        ) : user ? (
          <>
            <h2 style={{ color: "#333", marginBottom: "1rem" }}>
              Welcome, {user.email}!
            </h2>
            <button
              onClick={handleSignOut}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                borderRadius: "4px",
                backgroundColor: "#f44336",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </>
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

            {error && (
              <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default SignIn;
