// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA3FN_gLEYuQMOip49SLrFnfdXPAU9orp0",
  authDomain: "waypoint-auth.firebaseapp.com",
  projectId: "waypoint-auth",
  storageBucket: "waypoint-auth.firebasestorage.app",
  messagingSenderId: "439038166520",
  appId: "1:439038166520:web:4a17884a515c2245af020d",
  measurementId: "G-TPQS4R0ZFT"
};

// Prevent reinitialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider(); 

// Optional: attach auth to window for debugging
if (typeof window !== "undefined") {
  window.firebaseAuth = auth;
}

export { app, auth, db, storage, provider };
