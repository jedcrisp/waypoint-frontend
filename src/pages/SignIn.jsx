import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
} from "firebase/auth";
import { auth, provider } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
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

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign-in success:", result.user);
      navigate("/dashboard");
    } catch (err) {
      setError(`Google Sign-In Error: ${err.message}`);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setResetMessage("Please enter your email.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("✅ Password reset email sent.");
    } catch (err) {
      setResetMessage(`❌ ${err.message}`);
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

        {error && (
          <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>
        )}

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

          <div style={{ marginBottom: "1rem", position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
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
            Login
          </button>
        </form>

        {/* Google Sign-In Button */}
        <div className="mt-4 w-full"></div>
        <button
  onClick={handleGoogleSignIn}
  className="w-full flex items-center justify-center space-x-3 px-4 py-2 border border-gray-300 rounded-full bg-white text-sm font-medium text-gray-700 hover:shadow-md transition duration-150"
  >
  <svg
    className="w-5 h-5"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
  <span>Sign in with Google</span>
</button>


        {/* Forgot Password Link */}
        <p
          onClick={() => setShowModal(true)}
          style={{
            marginTop: "1rem",
            fontSize: "0.875rem",
            color: "#0074d9",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Forgot your password?
        </p>

        {/* Create Account Link */}
        <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#666" }}>
          Don’t have an account?{" "}
          <Link to="/signup" style={{ color: "#0074d9", textDecoration: "underline" }}>
            Create one
          </Link>
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-xl font-semibold mb-4 text-center">Reset Password</h2>
            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
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
                {resetMessage.includes("Password reset email sent") ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
