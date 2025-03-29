import React, { useState, useRef, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AccountMenu = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    navigate("/login"); // or wherever your login page is
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="text-white font-medium hover:underline focus:outline-none"
      >
        Account
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
          <button
            onClick={() => navigate("/account")}
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            Account Info
          </button>
          <button
            onClick={() => navigate("/archived-tests")}
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            Test History
          </button>
          <hr className="my-1 border-gray-200" />
          <button
            onClick={handleSignOut}
            className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
