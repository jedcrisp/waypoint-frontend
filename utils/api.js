import axios from "axios";

// Use Vite environment variable or default to localhost
const API_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"; 

export const getOpenAIResponse = async (prompt) => {
  try {
    const response = await axios.post(`${API_URL}/openai`, { prompt });
    return response.data.response;
  } catch (error) {
    console.error("API Error:", error.response?.data?.detail || error.message);
    return "Error: Unable to process your request.";
  }
};

