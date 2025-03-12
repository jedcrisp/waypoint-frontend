// Home.jsx
import React from "react";

const Home = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Testing App</h1>
      <p className="mb-4">
        Use the buttons above to select and run different tests.
      </p>
      <a
        href="http://127.0.0.1:8000/download-csv/"
        download="template.csv"
        className="inline-block px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
      >
        📥 Download Key Employee Template
      </a>
    </div>
  );
};

export default Home;
