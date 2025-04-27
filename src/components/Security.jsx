import React, { useState, useEffect, Fragment } from "react";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const Security = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showEmailCurrentPassword, setShowEmailCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // Detect if we're on the demo subdomain
  useEffect(() => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split(".")[0];
    setIsDemo(subdomain === "demo");
  }, []);

  const passwordMeetsRequirements = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    return regex.test(password);
  };

  const confirmPasswordChange = async () => {
    setShowPasswordConfirm(false);
    setError(null);
    setMessage(null);

    if (isDemo) {
      setError("Password updates are disabled in demo mode.");
      return;
    }

    if (!user) {
      setError("User is not signed in.");
      return;
    }

    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (!passwordMeetsRequirements(newPassword)) {
      setError(
        "Password must be at least 10 characters, include one uppercase, one lowercase, one number, and one special character."
      );
      return;
    }

    setLoading(true);
    try {
      await user.reload();
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      setMessage("✅ Password updated successfully. You’ll receive a confirmation email shortly.");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
    } catch (err) {
      console.error("Password Update Error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("❌ Current password is incorrect.");
      } else {
        setError(err.message || "❌ Failed to update password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmEmailChange = async () => {
    setShowEmailConfirm(false);
    setError(null);
    setMessage(null);

    if (isDemo) {
      setError("Email updates are disabled in demo mode.");
      return;
    }

    if (!user || !user.email) {
      setError("User is not signed in or email is missing.");
      return;
    }

    if (!emailCurrentPassword) {
      setError("Current password is required to update email.");
      return;
    }

    setLoading(true);
    try {
      await user.reload();
      const credential = EmailAuthProvider.credential(user.email, emailCurrentPassword);
      await reauthenticateWithCredential(user, credential);

      await updateEmail(user, newEmail);
      await sendEmailVerification(user);
      await sendPasswordResetEmail(newEmail);

      setMessage("✅ Email updated. Verification and reset emails sent to the new address.");
      setEmailCurrentPassword("");
    } catch (err) {
      console.error("Email Update Error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("❌ Current password is incorrect.");
      } else {
        setError(err.message || "❌ Failed to update email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 space-y-10">
      {/* Password Section */}
      <div className="p-6 bg-white shadow-md rounded-lg border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">🔐 Change Password</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isDemo) {
              setError("Password updates are disabled in demo mode.");
              return;
            }
            setShowPasswordConfirm(true);
          }}
          className="space-y-4"
        >
          <div className="relative">
            <label className="block font-semibold text-gray-700 mb-1">Current Password</label>
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md"
              required
              disabled={isDemo}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-9 text-gray-500"
              disabled={isDemo}
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <label className="block font-semibold text-gray-700 mb-1">New Password</label>
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md"
              required
              disabled={isDemo}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-9 text-gray-500"
              disabled={isDemo}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <label className="block font-semibold text-gray-700 mb-1">Confirm New Password</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md"
              required
              disabled={isDemo}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-gray-500"
              disabled={isDemo}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || isDemo}
            className={`w-full px-4 py-2 text-white rounded-md ${
              loading || isDemo ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

          {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </form>
      </div>

      {/* Email Section */}
      <div className="p-6 bg-white shadow-md rounded-lg border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">📧 Change Email</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isDemo) {
              setError("Email updates are disabled in demo mode.");
              return;
            }
            setShowEmailConfirm(true);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block font-semibold text-gray-700 mb-1">New Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
              disabled={isDemo}
            />
          </div>

          <div className="relative">
            <label className="block font-semibold text-gray-700 mb-1">Current Password</label>
            <input
              type={showEmailCurrentPassword ? "text" : "password"}
              value={emailCurrentPassword}
              onChange={(e) => setEmailCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md"
              required
              disabled={isDemo}
            />
            <button
              type="button"
              onClick={() => setShowEmailCurrentPassword(!showEmailCurrentPassword)}
              className="absolute right-3 top-9 text-gray-500"
              disabled={isDemo}
            >
              {showEmailCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || isDemo}
            className={`w-full px-4 py-2 text-white rounded-md ${
              loading || isDemo ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Updating..." : "Update Email"}
          </button>
        </form>
      </div>

      {/* Password Confirmation Modal */}
      <Transition appear show={showPasswordConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowPasswordConfirm(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  as={motion.div}
                  className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                >
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
                    Confirm Password Change
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to update your password?
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowPasswordConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={confirmPasswordChange}
                    >
                      Confirm
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Email Confirmation Modal */}
      <Transition appear show={showEmailConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowEmailConfirm(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  as={motion.div}
                  className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                >
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
                    Confirm Email Change
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to change your email to{" "}
                      <strong>{newEmail}</strong>?
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowEmailConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={confirmEmailChange}
                    >
                      Confirm
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Security;
