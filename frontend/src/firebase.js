import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCPj-38c8qnKEh64YNn56gKqtsPhWHMV8Y",
  authDomain: "adp-frontend.firebaseapp.com",
  projectId: "adp-frontend",
  storageBucket: "adp-frontend.firebasestorage.app",
  messagingSenderId: "894128539169",
  appId: "1:894128539169:web:04cf39c44bb03c5185c560"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };
