import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebase = {
  apiKey: "AIzaSyCPj-38c8qnKEh64YNn56gKqtsPhWHMV8Y",
  authDomain: "adp-frontend.firebaseapp.com",
  projectId: "adp-frontend",
  storageBucket: "adp-frontend.firebasestorage.app",
  messagingSenderId: "894128539169",
  appId: "1:894128539169:web:04cf39c44bb03c5185c560" ,
  measurementId: "G-TPQS4R0ZFT"
};

// Initialize Firebase
const app = initializeApp(firebase);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };
