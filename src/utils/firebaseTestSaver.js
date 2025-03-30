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

  // ✅ Save custom metadata
  await uploadBytes(pdfRef, pdfBlob, {
  contentType: "application/pdf",
  customMetadata: {
    planYear: additionalData?.planYear || "N/A",
    testResult: additionalData?.testResult || "Unknown",
  },
});


  const pdfURL = await getDownloadURL(pdfRef);

  // Optional Firestore save
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
