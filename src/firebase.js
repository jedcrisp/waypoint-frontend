// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA3FN_gLEYuQMOip49SLrFnfdXPAU9orp0",
  authDomain: "waypoint-auth.firebaseapp.com",
  projectId: "waypoint-auth",
  storageBucket: "waypoint-auth.firebasestorage.app",
  messagingSenderId: "439038166520",
  appId: "1:439038166520:web:4a17884a515c2245af020d",
  measurementId: "G-TPQS4R0ZFT"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };


