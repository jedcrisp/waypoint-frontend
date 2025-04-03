import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import waypointlogo from "../assets/waypointlogo.png";
import { Eye, EyeOff } from "lucide-react";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        navigate("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setResetMessage("Please enter your email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("📬 Password reset email sent!");
    } catch (err) {
      setResetMessage(err.message);
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
      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded mb-3"
            />
            {resetMessage && (
              <p className="text-sm text-gray-700 mb-2">{resetMessage}</p>
            )}
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePasswordReset}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Send Reset Email
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setResetEmail("");
                  setResetMessage("");
                }}
                className="text-gray-600 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
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
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#333" }}>
        </h1>

        {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="USERNAME"
              className="w-full px-4 py-2 border border-gray-300 rounded"
            />
          </div>
          <div style={{ marginBottom: "0.5rem", position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              className="w-full px-4 py-2 border border-gray-300 rounded"
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                right: "0.75rem",
                transform: "translateY(-50%)",
                cursor: "pointer",
              }}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          <div style={{ textAlign: "right", marginBottom: "1rem" }}>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#0074d9",
                cursor: "pointer",
                fontSize: "0.875rem",
                textDecoration: "underline",
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-500 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
