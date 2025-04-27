import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "./ChatAnalysis.css";

const LegalChatbot = ({ userEmail }) => {
    const navigate = useNavigate();
    const chatBoxRef = useRef(null);

    const [chatActive, setChatActive] = useState(true);
    const [messages, setMessages] = useState([
        { text: "Ask me any legal question!", sender: "assistant" }
    ]);
    const [input, setInput] = useState("");
    const [isResponding, setIsResponding] = useState(false);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isResponding) return;

        const userMessage = { text: input, sender: "user" };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsResponding(true);

        // Add typing indicator
        setMessages((prev) => [
            ...prev,
            {
                sender: "assistant",
                typing: true
            }
        ]);

        try {
            const formData = new FormData();
            formData.append("email", userEmail);
            formData.append("query", input);

            const response = await fetch("http://localhost:8000/legal_query", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            // Replace typing indicator with actual response
            setMessages((prev) => [
                ...prev.slice(0, -1),
                { text: data.answer, sender: "assistant" }
            ]);
        } catch (error) {
            console.error("Error submitting query:", error);
            setMessages((prev) => [
                ...prev,
                { text: "Oops! Something went wrong.", sender: "assistant" }
            ]);
        } finally {
            setIsResponding(false);
        }
    };

    return (
        <div className="chat-analysis-container">
            <button className="home-btn" onClick={() => navigate("/")}>🏠 Home</button>

            {chatActive && (
                <div className="chat-container">
                    <div className="chat-box" ref={chatBoxRef}>
                        {messages.length === 0 ? (
                            <p className="chat-placeholder">Ask your legal question...</p>
                        ) : (
                            messages.map((msg, index) => (
                                <div key={index} className={`message ${msg.sender}`}>
                                    {msg.typing ? (
                                        <span className="typing-dots">
                                            <strong></strong>
                                            <span className="dot">.</span>
                                            <span className="dot">.</span>
                                            <span className="dot">.</span>
                                        </span>
                                    ) : (
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="chat-input">
                        <input
                            type="text"
                            placeholder="Ask your legal question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            disabled={isResponding}
                        />

                        <button className="send-btn" onClick={handleSendMessage} disabled={isResponding}>
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LegalChatbot;
