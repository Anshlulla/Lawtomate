// pages/Dashboard.js
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = ({ setIsAuthenticated, setUserEmail }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear user session info from localStorage
        localStorage.removeItem("userEmail");

        // Update state to reflect logout
        setIsAuthenticated(false);
        setUserEmail(null);

        // Redirect to login page
        navigate("/");
    };

    return (
        <div className="dashboard-container">
            <h1>Lawtomate - An AI Powered Legal Assistant </h1>
            <p className="tagline">Simplifying Legal Processes with AI Agents</p>

            <button className="logout-btn" onClick={handleLogout}>
                Logout
            </button>

            <div className="workflow-buttons">
                <Link to="/summarize">
                    <button className="workflow-btn">
                        Summarization
                        <span className="tooltip">Get a concise summary of legal documents.</span>
                    </button>
                </Link>

                <Link to="/chat-analysis">
                    <button className="workflow-btn">
                        Chat Analysis
                        <span className="tooltip">Chat with legal contracts and analyze clauses.</span>
                    </button>
                </Link>

                <Link to="/qna">
                    <button className="workflow-btn">
                        Law-Search
                        <span className="tooltip">Solve all your legal queries through this chatbot.</span>
                    </button>
                </Link>

                <Link to="/voice-assistant">
                    <button className="workflow-btn">
                        Voice Assistant
                        <span className="tooltip">Ask legal questions through voice commands.</span>
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
