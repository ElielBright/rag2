import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { FaPaperPlane, FaMicrophone, FaTrash, FaRedo } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";

function Sidebar({ chats, addNewChat, selectChat, deleteChat }) {
  return (
    <div className="sidebar">
      <div className="top-section">
        <button className="new-chat-btn" onClick={addNewChat}>
          New Chat
        </button>
        <div className="chat-list">
          {chats.map((chat) => (
            <div key={chat.id} className="menu-item" onClick={() => selectChat(chat.id)}>
              {chat.title.length > 15 ? chat.title.slice(0, 15) + "..." : chat.title}
              <FaTrash
                className="delete-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
const MainChat = ({ selectedChat, updateChat, addNewChat, setChats, setSelectedChatId, socket }) => {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);  // New state for typing animation
  const chatBoxRef = useRef(null);


 // Voice Recognition State
 const [isListening, setIsListening] = useState(false);
 const recognitionRef = useRef(null);

 // Initialize Speech Recognition
 useEffect(() => {
   if ("webkitSpeechRecognition" in window) {
     const SpeechRecognition = window.webkitSpeechRecognition;
     recognitionRef.current = new SpeechRecognition();
     recognitionRef.current.continuous = false;
     recognitionRef.current.interimResults = false;
     recognitionRef.current.lang = "en-US";

     recognitionRef.current.onstart = () => setIsListening(true);
     recognitionRef.current.onend = () => setIsListening(false);

     recognitionRef.current.onresult = (event) => {
       const transcript = event.results[0][0].transcript;
       setInput((prevInput) => prevInput + " " + transcript);
     };
   }
 }, []);

 // Handle Voice Input Start/Stop
 const handleMicClick = () => {
   if (isListening) {
     recognitionRef.current.stop();
   } else {
     recognitionRef.current.start();
   }
 };


  // Scroll to the bottom when a new message is added
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [selectedChat?.messages, isTyping]);

  // WebSocket message handler
  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      setIsTyping(false);  // Stop typing animation when a response is received
      const data = JSON.parse(event.data);
      if (selectedChat) {
        const aiResponse = { text: data.response, sender: "ai" };
        updateChat(selectedChat.id, [...selectedChat.messages, aiResponse]);
      }
    };

    return () => {
      socket.onmessage = null;
    };
  }, [socket, selectedChat, updateChat]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = { text: input, sender: "user" };

    if (!selectedChat) {
      const chatId = uuidv4();
      const newChat = {
        id: chatId,
        title: input,
        messages: [newMessage],
      };

      setChats((prevChats) => [...prevChats, newChat]);
      setSelectedChatId(chatId);
      socket.send(input);
    } else {
      updateChat(selectedChat.id, [...selectedChat.messages, newMessage]);
      socket.send(input);
    }

    setInput("");
    setIsTyping(true);  // Start typing animation after sending message
  };

  return (
    <div className="main-content">
      {selectedChat ? (
        <div className="chat-header">
          <h1>{selectedChat.title}</h1>
          <FaRedo className="refresh-icon" onClick={() => updateChat(selectedChat.id, [])} />
        </div>
      ) : (
        <h1>Select or Start a Chat</h1>
      )}

      <div className="chat-box" ref={chatBoxRef}>
        {selectedChat && selectedChat.messages.length === 0 ? (
          <p className="empty-chat">Start a new conversation...</p>
        ) : (
          selectedChat &&
          selectedChat.messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender}`}>
              {msg.text}
            </div>
          ))
        )}

        {/* Typing animation */}
        {isTyping && (
          <div className="chat-message ai">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="input-container">
        <input
          type="text"
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="input-buttons">
        <FaMicrophone
            className={`icon mic-icon ${isListening ? "listening" : ""}`}
            onClick={handleMicClick}
          />
          <FaPaperPlane className="icon send-icon" onClick={handleSend} />
        </div>
      </div>
    </div>
  );
};

function App() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");

    ws.onopen = () => console.log("Connected to WebSocket");
    ws.onerror = (error) => console.error("WebSocket Error:", error);
    ws.onclose = () => console.log("WebSocket Disconnected");

    setSocket(ws);

    return () => ws.close();
  }, []);

  const addNewChat = () => {
    const newChat = {
      id: uuidv4(),
      title: "New Chat",
      messages: [],
    };
    setChats([...chats, newChat]);
    setSelectedChatId(newChat.id);
  };

  const selectChat = (id) => setSelectedChatId(id);

  const deleteChat = (id) => {
    setChats(chats.filter((chat) => chat.id !== id));
    if (selectedChatId === id) setSelectedChatId(null);
  };

  const updateChat = (id, messages) => {
    setChats(chats.map((chat) => (chat.id === id ? { ...chat, messages } : chat)));
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  return (
    <div className="app-container">
      <Sidebar chats={chats} addNewChat={addNewChat} selectChat={selectChat} deleteChat={deleteChat} />
      <MainChat
        selectedChat={selectedChat}
        updateChat={updateChat}
        addNewChat={addNewChat}
        setChats={setChats}
        setSelectedChatId={setSelectedChatId}
        socket={socket}
      />
    </div>
  );
}

export default App;
