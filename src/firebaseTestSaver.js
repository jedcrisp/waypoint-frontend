import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "../firebase";

export const savePdfResultToFirebase = async ({ fileName, pdfBlob, additionalData = {} }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");

  const uid = user.uid;
  const timestamp = Date.now();
  const basePath = `users/${uid}/pdfResults/${fileName}-${timestamp}`;
  const pdfRef = ref(storage, `${basePath}/result.pdf`);

  await uploadBytes(pdfRef, pdfBlob, {
    contentType: "application/pdf",
    customMetadata: {
      planYear: additionalData?.planYear || "N/A",
      testResult: additionalData?.testResult || "Unknown",
      aiConsent: JSON.stringify(additionalData?.aiConsent || {}),
    },
  });

  const pdfURL = await getDownloadURL(pdfRef);

  const resultDoc = doc(db, `users/${uid}/pdfResults/${fileName}-${timestamp}`);
  await setDoc(resultDoc, {
    fileName,
    pdfPath: `${basePath}/result.pdf`,
    pdfURL,
    ...additionalData,
    createdAt: new Date().toISOString(),
  });

  console.log("✅ PDF result saved to Firebase with URL:", pdfURL);
  return pdfURL;
};

export const saveAIReviewConsent = async ({ fileName, signature }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");

  const timestamp = Date.now();
  const consentDoc = doc(db, `users/${user.uid}/aiReviewConsents/${fileName}-${timestamp}`);

  await setDoc(consentDoc, {
    fileName,
    signature,
    agreed: true,
    email: user.email,
    createdAt: new Date().toISOString(),
  });

  console.log("✅ AI Review consent saved to Firestore");
};

export const saveDeletionConsent = async ({ testId, signature }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const uid = user.uid;
  const docRef = doc(db, `users/${uid}/deletedTests/${testId}`);

  await setDoc(docRef, {
    signature,
    deletedAt: new Date().toISOString(),
    email: user.email,
  });

  console.log("✅ Deletion consent saved to Firestore at:", `users/${uid}/deletedTests/${testId}`);
};

export const removeTestFromPurchased = async (userId, testId) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      purchasedTests: arrayRemove(testId),
    });
    console.log(`✅ Removed test ${testId} from user's purchased tests`);
  } catch (error) {
    console.error("❌ Error removing test from purchasedTests:", error);
    throw error; // Optional: rethrow for error handling in ACPTest.jsx
  }
};
