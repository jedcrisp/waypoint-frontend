import React, { useState } from "react";
import { getOpenAIResponse } from "../../utils/api.js"; // Ensure this path is correct

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);

    try {
      const response = await getOpenAIResponse(input);
      setMessages([...newMessages, { role: "assistant", content: response }]);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 ${isOpen ? "w-80 h-96" : "w-25 h-12"} bg-white rounded-lg shadow-lg`}>
      <div className="flex items-center justify-center h-full" onClick={() => setIsOpen(!isOpen)}>
        {!isOpen ? (
          <button className="text-black text-lg w-full">Chat</button>
        ) : (
          <div className="flex flex-col w-full h-full p-2 bg-white rounded-lg">
            {/* Close Button */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-gray-700">Chat</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsOpen(false)}
              >
                ✖
              </button>
            </div>
            <div className="flex-grow overflow-y-auto">
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
                placeholder="Type your message..."
              />
              <button className="ml-2 px-4 py-2 bg-blue-500 text-white rounded" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;
