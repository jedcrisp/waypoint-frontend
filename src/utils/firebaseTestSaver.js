// utils/firebaseTestSaver.js
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export const savePdfResultToFirebase = async ({ fileName, pdfBlob, additionalData = {} }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");

  const uid = user.uid;
  const timestamp = Date.now();
  const basePath = `users/${uid}/pdfResults/${fileName}-${timestamp}`;
  const pdfRef = ref(storage, `${basePath}/result.pdf`);

  // Save PDF with custom metadata
  await uploadBytes(pdfRef, pdfBlob, {
    contentType: "application/pdf",
    customMetadata: {
      planYear: additionalData?.planYear || "N/A",
      testResult: additionalData?.testResult || "Unknown",
      // You can include consent info as JSON-string if you wish:
      aiConsent: JSON.stringify(additionalData?.aiConsent || {}),
    },
  });

  const pdfURL = await getDownloadURL(pdfRef);

  // Save document metadata in Firestore
  const db = getFirestore();
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

  const db = getFirestore();
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
