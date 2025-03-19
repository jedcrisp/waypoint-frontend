import React, { useState } from "react";
import axios from "axios";

export default function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false); // State to toggle chat visibility

  const sendMessage = async (source) => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);

    try {
      let responseData = "";

      if (source === "openai") {
        // OpenAI API Call
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [{ role: "user", content: input }],
          }),
        });

        const data = await response.json();
        responseData = data.choices[0].message.content;
      } else if (source === "local") {
        // Local API Call
        const res = await axios.post("http://localhost:8000/generate-response/", {
          prompt: input,
        });
        responseData = res.data.response;
      }

      setMessages([...newMessages, { role: "assistant", content: responseData }]);
      setInput("");
    } catch (error) {
      console.error("Error fetching response:", error);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Chat Toggle Button */}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "Close Chat" : "Chat"}
      </button>

      {/* Chat Box (Hidden by Default) */}
      {isOpen && (
        <div className="bg-white p-4 rounded-lg shadow-lg w-96 mt-2 border border-gray-300">
          <div className="h-60 overflow-y-auto p-2">
            {messages.map((msg, index) => (
              <div key={index} className={`p-2 my-1 rounded ${msg.role === "user" ? "bg-blue-200 text-right" : "bg-gray-200 text-left"}`}>
                {msg.content}
              </div>
            ))}
          </div>

          <div className="flex mt-2">
            <input
              type="text"
              className="flex-1 p-2 border rounded"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
            />
            <button className="ml-2 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => sendMessage("openai")}>
              OpenAI
            </button>
            <button className="ml-2 px-4 py-2 bg-green-500 text-white rounded" onClick={() => sendMessage("local")}>
              Local API
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
