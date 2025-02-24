import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaMicrophone } from "react-icons/fa";
import "./App.css";

function MainChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatBoxRef = useRef(null);

  const typeEffect = (text) => {
    setTypingMessage(""); 
    let index = 0;
    setIsTyping(true);
  
    const typingInterval = setInterval(() => {
      setTypingMessage((prev) => 
        prev + `<span style="animation-delay: ${index * 50}ms">${text.charAt(index)}</span>`
      );
      index++;
      if (index === text.length) {
        clearInterval(typingInterval);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text, sender: "bot" },
        ]);
        setTypingMessage("");
        setIsTyping(false);
      }
    }, 50); // Adjust speed here
  };
  
  const handleSend = () => {
    if (input.trim() === "") return;

    const userMessage = { text: input, sender: "user" };
    setMessages([...messages, userMessage]);
    setInput("");

    // Simulate a bot response with typing effect
    const botResponse = `You said: ${input}`;
    typeEffect(botResponse);
  };

  // Scroll to the bottom when a new message is added
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, typingMessage]);

  return (
    <div className="main-content">
     <div className="chat-container">
  {messages.map((msg, index) => (
    <div key={index} className={`message ${msg.sender}-message`}>
      {msg.text}
    </div>
  ))}

  {isTyping && (
    <div className="message bot-message typing" dangerouslySetInnerHTML={{ __html: typingMessage }}></div>
  )}
</div>


      <div className="input-container">
        <input
          type="text"
          placeholder="Message ChatGPT"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <div className="input-buttons">
          <FaPaperPlane className="icon send-icon" onClick={handleSend} />
          <FaMicrophone className="icon mic-icon" />
        </div>
      </div>
    </div>
  );
}

export default MainChat;
