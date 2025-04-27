import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import "./ChatAnalysis.css";

const API_BASE = "http://localhost:8002";
const API_KEY = process.env.REACT_APP_API_KEY;

const ChatAnalysis = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [chatActive, setChatActive] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const chatBoxRef = useRef(null);
    const [isResponding, setIsResponding] = useState(false);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
        } else {
            alert("Please upload a valid PDF file.");
        }
    };

    const handleStartChat = async () => {
        if (!file) return;

        setProcessing(true);

        try {
            const res = await fetch(`${API_BASE}/start_session`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${API_KEY}` },
            });
            const data = await res.json();
            const sessionId = data.session_id;

            const formData = new FormData();
            formData.append("file", file);
            formData.append("session_id", sessionId);

            await fetch(`${API_BASE}/embed_document`, {
                method: "POST",
                body: formData,
            });

            localStorage.setItem("session_id", sessionId);
            setMessages([
                { text: "The contract has been processed. Ask me anything about it!", sender: "assistant" }
            ]);
            setChatActive(true);
        } catch (error) {
            console.error(error);
            alert("Something went wrong while starting the session.");
        } finally {
            setProcessing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isResponding) return;

        const sessionId = localStorage.getItem("session_id");
        if (!sessionId) {
            alert("Session ID not found. Please upload a document first.");
            return;
        }

        const userMessage = { text: input, sender: "user" };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsResponding(true);

        // Show assistant "Analyzing..." typing
        setMessages((prev) => [
            ...prev,
            {
                sender: "assistant",
                typing: true
            },
        ]);

        try {
            const formData = new FormData();
            formData.append("session_id", sessionId);
            formData.append("question", input);

            const res = await fetch(`${API_BASE}/ask`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            setMessages((prev) => [
                ...prev.slice(0, -1),
                { text: data.answer, sender: "assistant" }
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev.slice(0, -1),
                { text: "Something went wrong while getting the answer.", sender: "assistant" }
            ]);
        } finally {
            setIsResponding(false);
        }
    };

    return (
        <div className="chat-analysis-container">
            <button className="home-btn" onClick={() => navigate("/")}>🏠 Home</button>

            {!chatActive ? (
                <>
                    <h1>Analyze Legal Contracts</h1>
                    <p className="tagline">Upload any legal contract and query over it.</p>

                    <div className="file-upload">
                        <input
                            type="file"
                            id="fileInput"
                            className="file-input"
                            accept=".pdf"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="fileInput" className="file-label">Choose PDF</label>
                        <span className="file-name">{file ? file.name : "No file chosen"}</span>
                    </div>

                    <button className="start-chat-btn" onClick={handleStartChat} disabled={!file}>
                        Start Chat
                    </button>

                    {processing && (
                        <div className="processing-overlay">
                            <div className="processing-box">
                                <p>Processing contract...</p>
                                <div className="loading-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="chat-container">
                    <div className="chat-box" ref={chatBoxRef}>
                        {messages.length === 0 ? (
                            <p className="chat-placeholder">Start asking about the contract...</p>
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
                                        <ReactMarkdown>
                                            {msg.text}
                                        </ReactMarkdown>

                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="chat-input">
                        <input
                            type="text"
                            placeholder="Ask about the contract..."
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

export default ChatAnalysis;
