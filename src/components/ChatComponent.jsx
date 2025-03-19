import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom"; // Import useLocation
import { getOpenAIResponse } from "../../utils/api.js"; // Ensure this path is correct

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null); // Ref to track the end of the messages container
  const location = useLocation(); // Get the current route

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission behavior
      handleSendMessage();
    }
  };

  // Scroll to the bottom of the messages container whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Determine styles for the minimized chat box based on the current route
  const isHomePage = location.pathname === "/";
  const minimizedBoxStyles = isHomePage
    ? "bg-white text-black"
    : "bg-[#0074d9] text-white";

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 ${
        isOpen ? "w-80 h-96 bg-white" : `w-25 h-12 ${minimizedBoxStyles}`
      } rounded-lg shadow-lg`}
    >
      <div
        className="flex items-center justify-center h-full"
        onClick={() => !isOpen && setIsOpen(true)} // Only toggle open when minimized
      >
        {!isOpen ? (
          <button className="text-lg w-full">Chat</button>
        ) : (
          <div
            className="flex flex-col w-full h-full p-2 rounded-lg"
            onClick={(e) => e.stopPropagation()} // Prevent click propagation
          >
            {/* Close Button */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold">Waypoint AI Assistant</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsOpen(false)}
              >
                ✖
              </button>
            </div>
            {/* Messages Container */}
            <div className="flex-grow overflow-y-auto">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 my-1 rounded ${
                    msg.role === "user" ? "bg-blue-200 text-right" : "bg-gray-200 text-left"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {/* Scroll Anchor */}
              <div ref={messagesEndRef} />
            </div>
            {/* Input Field */}
            <div className="flex mt-2">
              <input
                type="text"
                className="flex-1 p-2 border rounded"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown} // Trigger send on Enter key press
                placeholder="Type your message..."
              />
              <button
                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleSendMessage}
              >
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
