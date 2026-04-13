import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css"; 

export default function Home() {
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startScan = async () => {
    if (!repo) return alert("Please enter a GitHub repository link.");

    setLoading(true);

    try {
      await fetch("http://127.0.0.1:8000/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo }),
      });

      // immediately go to report page
      navigate("/report");

    } catch (err) {
      alert("Server not running or unable to connect.");
    }

    setLoading(false);
  };

  return (
    <div className="app-container fade-in">
      <div className="text-center w-full" style={{ maxWidth: '800px' }}>
        <h1 className="display-title">
          <span className="gradient-text">AI Attack Simulator</span>
        </h1>
        <p className="mb-8" style={{ fontSize: '1.2rem' }}>
          Instantly simulate AI attacks and secure your repositories against the latest vulnerabilities.
        </p>

        <div className="glass-card flex-col items-center gap-6 stagger-1">
          <input
            placeholder="Paste GitHub Repo URL (e.g., https://github.com/user/repo)"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="modern-input"
            disabled={loading}
          />

          {!loading ? (
            <button className="btn-primary mt-4" onClick={startScan} disabled={!repo}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
              Start Analysis Engine
            </button>
          ) : (
            <div className="flex-col items-center mt-4">
              <div className="spinner"></div>
              <p className="animate-pulse m-0">Initializing attack simulation... ⏳</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}