// src/components/UploadButton.jsx
import React, { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

const UploadButton = ({ testCompleted }) => {
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Upload file to Firebase Storage
  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      // Create a storage reference (uploads folder with the original file name)
      const storageRef = ref(storage, `uploads/${file.name}`);

      // Upload the file
      await uploadBytes(storageRef, file);

      // Get the download URL for the uploaded file
      const url = await getDownloadURL(storageRef);
      setUploadUrl(url);
      alert("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Conditionally render the upload button only if the test is completed
  if (!testCompleted) {
    return null; // Do not render anything if the test is not completed
  }

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "4px", marginTop: "20px" }}>
      <h3 style={{ marginBottom: "10px" }}>Upload File to Firebase Storage</h3>
      <input
        type="file"
        onChange={handleFileChange}
        style={{
          display: "block",
          marginBottom: "10px",
          padding: "5px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
      <button
        onClick={handleUpload}
        disabled={isUploading}
        style={{
          padding: "10px 20px",
          backgroundColor: isUploading ? "#ccc" : "#0074d9",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isUploading ? "not-allowed" : "pointer",
          fontSize: "16px",
        }}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {uploadUrl && (
        <div style={{ marginTop: "20px" }}>
          <p style={{ marginBottom: "5px" }}>File uploaded successfully. You can download it here:</p>
          <a
            href={uploadUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#0074d9",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Download File
          </a>
        </div>
      )}
    </div>
  );
};

export default UploadButton;
