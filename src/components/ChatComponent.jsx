import { useState } from "react";
import axios from "axios";

export default function ChatComponent() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await axios.post("http://localhost:8000/generate-response/", {
        prompt: input,
      });
      setResponse(res.data.response);
    } catch (error) {
      console.error("Error fetching AI response:", error);
    }
  };

  return (
    <div className="chat-container">
      <textarea 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask OpenAI a question..."
      />
      <button onClick={handleSubmit}>Generate</button>
      <div className="response">{response}</div>
    </div>
  );
}
