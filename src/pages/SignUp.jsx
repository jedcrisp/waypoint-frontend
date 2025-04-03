import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SignUp() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    address: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
  const requiredFields = [
    "firstName",
    "lastName",
    "email",
    "password",
    "confirmPassword",
  ];

  for (let field of requiredFields) {
    if (!form[field]) {
      return { valid: false, message: `${field} is required` };
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return { valid: false, message: "Invalid email format" };
  }

  // Strong password regex
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!passwordRegex.test(form.password)) {
    return {
      valid: false,
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    };
  }

  if (form.password !== form.confirmPassword) {
    return { valid: false, message: "Passwords do not match" };
  }

  return { valid: true };
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { valid, message } = validateForm();

    if (!valid) {
      toast.error(message);
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${form.firstName} ${form.lastName}`,
      });

      await setDoc(doc(db, "users", user.uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        company: form.company,
        address: form.address,
        phone: form.phone,
        email: form.email,
        uid: user.uid,
      });

      toast.success("Account created!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100">
      <ToastContainer position="top-center" />
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Your Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded" />
          <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded" />
          <input name="company" placeholder="Company" value={form.company} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded" />
          <input name="address" placeholder="Address" value={form.address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded" />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded" />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded" />

          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded"
            />
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          <div className="relative">
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded"
            />
            {form.confirmPassword && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {form.confirmPassword === form.password ? (
                  <CheckCircle className="text-green-500" />
                ) : (
                  <XCircle className="text-red-500" />
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/signin" className="text-blue-500 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
