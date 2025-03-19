import "virtual:windi.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from './AuthContext';
import { app } from "./firebase"; // ✅ Import Firebase to ensure it loads

console.log("Firebase App Initialized:", app); // ✅ Check if Firebase loads

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
