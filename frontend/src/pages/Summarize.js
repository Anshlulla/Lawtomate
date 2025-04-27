import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import "./Summarize.css";

const Summarize = () => {
    const API_KEY = process.env.REACT_APP_API_KEY;
    const navigate = useNavigate();
    const [inputType, setInputType] = useState("text");
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState("No file chosen");

    // Handle switching input type and reset inputs
    const handleInputChange = (type) => {
        setInputType(type);
        setSummary("");
        setText("");
        setFile(null);
        setSelectedFileName("No file chosen");
    };

    const handleTextChange = (e) => setText(e.target.value);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setSelectedFileName(selectedFile ? selectedFile.name : "No file chosen");
    };

    // Function to generate PDF and download
    const handleDownloadPDF = () => {
        if (!summary) {
            alert("No summary available to download.");
            return;
        }

        const pdf = new jsPDF();
        const marginX = 15;
        let marginY = 20;
        const pageHeight = pdf.internal.pageSize.height;

        // Get the filename (if a file was uploaded)
        const filename = file ? file.name : "File Name Not Available";

        // Set BOLD and BIGGER heading with filename
        pdf.setFont("times", "bold");
        pdf.setFontSize(18);
        pdf.text(`Legal Document Summary (${filename})`, marginX, marginY);

        // Reset font for normal text
        pdf.setFont("times", "normal");
        pdf.setFontSize(12);
        marginY += 12; // Adjust margin after the heading

        // Convert HTML to properly formatted text
        const formattedText = summary
            .replace(/<strong>(.*?)<\/strong>/g, "**$1**") // Mark bold text
            .replace(/<em>(.*?)<\/em>/g, "*$1*") // Mark italics
            .replace(/<[^>]+>/g, ""); // Remove all other HTML tags

        // Split text into lines for proper PDF formatting
        const lines = pdf.splitTextToSize(formattedText, 180);

        lines.forEach((line) => {
            if (marginY + 10 > pageHeight - 20) {
                pdf.addPage();
                marginY = 20;
            }

            if (line.includes("**")) {
                pdf.setFont("times", "bold");
                pdf.text(line.replace(/\*\*/g, ""), marginX, marginY);
                pdf.setFont("times", "normal");
            } else if (line.includes("*")) {
                pdf.setFont("times", "italic");
                pdf.text(line.replace(/\*/g, ""), marginX, marginY);
                pdf.setFont("times", "normal");
            } else {
                pdf.text(line, marginX, marginY);
            }

            marginY += 7;
        });

        pdf.save(`Legal_Summary_${filename}.pdf`);
    };

    const handleSummarize = async () => {
        if (inputType === "text" && !text.trim()) {
            alert("Please enter some text to summarize");
            return;
        }
        if (inputType === "file" && !file) {
            alert("Please upload a file to summarize");
            return;
        }

        setLoading(true);
        setSummary("");

        const formData = new FormData();
        inputType === "text" ? formData.append("text", text) : formData.append("file", file);

        try {
            const response = await fetch("http://127.0.0.1:8001/summarize", {
                method: "POST",
                headers: { "Authorization": `Bearer ${API_KEY}` },
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                const formattedSummary = data.summary.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                setSummary(formattedSummary);
            } else {
                alert(`Error: ${data.detail || "Failed to summarize"}`);
            }
        } catch (error) {
            alert("Failed to connect to the server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="summarization-container">
            <button className="home-btn" onClick={() => navigate("/")}> 🏠 Home</button>
            <h1>Get a concise summary for all your legal documents</h1>

            {/* Radio Button Selection */}
            <div className="input-selection">
                <label className={`radio-option ${inputType === "text" ? "selected" : ""}`} onClick={() => handleInputChange("text")}>
                    Enter text
                </label>
                <label className={`radio-option ${inputType === "file" ? "selected" : ""}`} onClick={() => handleInputChange("file")}>
                    Upload a file (PDF/Word)
                </label>
            </div>

            {/* Input Area */}
            {inputType === "text" ? (
                <textarea className="text-input" placeholder="Enter text to summarize..." value={text} onChange={handleTextChange} />
            ) : (
                <div className="file-upload">
                    <input type="file" id="fileInput" className="file-input" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                    <label htmlFor="fileInput" className="file-label">Choose File</label>
                    <span id="file-name">{selectedFileName}</span>
                </div>
            )}

            {/* Summarize Button */}
            <button className="summarize-btn" onClick={handleSummarize} disabled={loading}>
                {loading ? (
                    <div className="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                ) : (
                    "Summarize"
                )}
            </button>

            {/* Summary Output */}
            {summary && (
                <div className="summary-output">
                    <h2>Summary</h2>
                    <div className="summary-content" dangerouslySetInnerHTML={{ __html: summary }} />

                    {/* Download PDF Button Positioned Below */}
                    <div className="download-container">
                        <button className="download-pdf-btn" onClick={handleDownloadPDF}>📄 Download PDF</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Summarize;
