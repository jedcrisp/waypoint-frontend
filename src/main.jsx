import "virtual:windi.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";  // Make sure this is here!
import App from "./App";
import { AuthProvider } from './AuthContext';
import { app } from "./firebase"; // Import Firebase

console.log("Firebase App Initialized:", app);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
