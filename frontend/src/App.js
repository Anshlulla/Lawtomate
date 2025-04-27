// App.js
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Summarize from "./pages/Summarize";
import ChatAnalysis from "./pages/ChatAnalysis";
import VoiceAssistant from "./pages/VoiceAssistant";
import Chatbot from "./pages/Chatbot";
import Login from "./pages/Login";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState(null);

    useEffect(() => {
        const storedEmail = localStorage.getItem("userEmail");
        if (storedEmail) {
            setUserEmail(storedEmail);
            setIsAuthenticated(true);
        }
    }, []);

    // A little helper to wrap any page that requires auth
    const Private = (Component) =>
        isAuthenticated ? (
            <Component setIsAuthenticated={setIsAuthenticated} setUserEmail={setUserEmail} />
        ) : (
            <Navigate to="/login" replace />
        );

    return (
        <Routes>
            {/* 1) Make /login the first, public route */}
            <Route
                path="/login"
                element={<Login setIsAuthenticated={setIsAuthenticated} setUserEmail={setUserEmail} />}
            />

            {/* 2) Redirect from “/” to either Dashboard (if auth) or Login */}
            <Route
                path="/"
                element={
                    isAuthenticated
                        ? <Dashboard setIsAuthenticated={setIsAuthenticated} setUserEmail={setUserEmail} />
                        : <Navigate to="/login" replace />
                }
            />

            {/* 3) Protect every other page behind a redirect to /login */}
            <Route path="/summarize" element={Private(Summarize)} />
            <Route path="/chat-analysis" element={Private(ChatAnalysis)} />
            <Route path="/qna" element={Private(Chatbot)} />
            <Route path="/voice-assistant" element={Private(VoiceAssistant)} />

            {/* 4) Catch‑all: send unknown URLs back to “/” */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
