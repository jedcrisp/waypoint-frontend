// createUserDocument.js
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function createUserDocument(user, additionalData = {}) {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  try {
    await setDoc(
      userRef,
      {
        email: user.email,
        purchasedTests: [], // Initially empty; will be updated after a purchase
        ...additionalData,
      },
      { merge: true }
    );
    console.log("User document created/updated.");
  } catch (error) {
    console.error("Error creating user document:", error);
  }
}
