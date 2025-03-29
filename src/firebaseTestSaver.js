// src/utils/firebaseTestSaver.js
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.js";

/**
 * Saves a PDF result to Firebase Storage and stores metadata in Firestore.
 *
 * @param {Object} params - Parameters for saving the PDF result.
 * @param {string} params.fileName - The base file name for the PDF.
 * @param {Blob} params.pdfBlob - The PDF Blob to upload.
 * @param {Object} [params.additionalData={}] - Optional additional data to store in Firestore.
 * @returns {Promise<string>} - Returns a promise that resolves to the download URL of the uploaded PDF.
 */
export const savePdfResultToFirebase = async ({ fileName, pdfBlob, additionalData = {} }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated.");

  const uid = user.uid;
  const timestamp = Date.now();
  // Construct a unique storage path for the PDF result
  const basePath = `users/${uid}/pdfResults/${fileName}-${timestamp}`;

  // Create a storage reference for the PDF file
  const pdfRef = ref(storage, `${basePath}/result.pdf`);

  // Upload the PDF Blob to Firebase Storage
  await uploadBytes(pdfRef, pdfBlob);

  // Retrieve the download URL for the uploaded PDF
  const pdfURL = await getDownloadURL(pdfRef);

  // Store metadata in Firestore (including the PDF URL) so you can retrieve it later
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
