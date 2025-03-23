// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA3FN_gLEYuQMOip49SLrFnfdXPAU9orp0",
  authDomain: "waypoint-auth.firebaseapp.com",
  projectId: "waypoint-auth",
  storageBucket: "waypoint-auth.appspot.com", // ✅ Fixed URL
  messagingSenderId: "439038166520",
  appId: "1:439038166520:web:4a17884a515c2245af020d",
  measurementId: "G-TPQS4R0ZFT"
};

// Prevent reinitialization if Firebase is already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// window.auth = auth; (For testing)

window.firebaseAuth = auth;

// Initialize Firebase Storage and export it
export const storage = getStorage(app);

export { app, auth };
