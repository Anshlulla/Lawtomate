import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { vapi, startAssistant, stopAssistant } from "./ai";
import ActiveCallDetails from "../call/ActiveCallDetails";
import "./VoiceAssistant.css";

function VoiceAssistant() {
    const [started, setStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        vapi
            .on("call-start", () => {
                setLoading(false);
                setStarted(true);
            })
            .on("call-end", () => {
                setStarted(false);
                setLoading(false);
                setAssistantIsSpeaking(false);
                setVolumeLevel(0);
            })
            .on("speech-start", () => {
                setAssistantIsSpeaking(true);
            })
            .on("speech-end", () => {
                setAssistantIsSpeaking(false);
            })
            .on("volume-level", (level) => {
                setVolumeLevel(level);
            });
    }, []);

    const handleStart = async () => {
        setLoading(true);
        await startAssistant();
    };

    const handleStop = () => {
        stopAssistant();
        setStarted(false);
        setAssistantIsSpeaking(false);
        setVolumeLevel(0);
    };

    const goHome = () => {
        navigate("/");
    };

    return (
        <div className="app-container">
            <button className="home-btn" onClick={goHome}>🏠 Home</button>

            <div className="assistant-card">
                <h1 className="title">Lexi - Legal Voice Assistant</h1>
                <p className="tagline">Talk Legal.. Lexi Gets It!</p>

                {!started && !loading && (
                    <button className="button" onClick={handleStart}>
                        Start Assistant Call
                    </button>
                )}

                {loading && (
                    <div className="loading">Connecting to assistant...</div>
                )}

                {started && (
                    <>
                        <ActiveCallDetails
                            assistantIsSpeaking={assistantIsSpeaking}
                            volumeLevel={volumeLevel}
                            endCallCallback={handleStop}
                        />

                        <div className="volume-meter">
                            <div className="bar" style={{ width: `${volumeLevel}%` }}></div>
                        </div>

                        {assistantIsSpeaking && (
                            <div className="assistant-speaking">
                                The assistant is speaking...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default VoiceAssistant;
