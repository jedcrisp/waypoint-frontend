import React, { useState } from "react";
import axios from "axios";

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    inquiryType: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(false);
    setError(null);

    try {
      await axios.post("/api/contact", formData);
      setSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        organization: "",
        inquiryType: "",
        message: "",
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
        Contact Us
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            name="firstName"
            placeholder="First name *"
            required
            className="w-1/2 px-4 py-2 border rounded-md"
            value={formData.firstName}
            onChange={handleChange}
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last name *"
            required
            className="w-1/2 px-4 py-2 border rounded-md"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Email *"
          required
          className="w-full px-4 py-2 border rounded-md"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type="text"
          name="organization"
          placeholder="Organization"
          className="w-full px-4 py-2 border rounded-md"
          value={formData.organization}
          onChange={handleChange}
        />

        <input
          type="text"
          name="inquiryType"
          placeholder="Type of inquiry *"
          required
          className="w-full px-4 py-2 border rounded-md"
          value={formData.inquiryType}
          onChange={handleChange}
        />

        <textarea
          name="message"
          placeholder="Write your message here"
          className="w-full px-4 py-2 border rounded-md"
          rows={4}
          value={formData.message}
          onChange={handleChange}
        ></textarea>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>

        {submitted && (
          <p className="text-green-600 text-center mt-2">
            ✅ Message sent successfully!
          </p>
        )}

        {error && (
          <p className="text-red-600 text-center mt-2">{error}</p>
        )}
      </form>
    </div>
  );
};

export default Contact;
