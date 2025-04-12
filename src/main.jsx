import "virtual:windi.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from './AuthContext';
import { app } from "./firebase";
import { BrowserRouter } from "react-router-dom"; // ✅ Import this
import 'react-toastify/dist/ReactToastify.css';


console.log("Firebase App Initialized:", app);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter> {/* ✅ Wrap in router context */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
