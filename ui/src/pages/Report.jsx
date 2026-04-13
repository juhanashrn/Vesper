import { useEffect, useState } from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";

export default function Report() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchResult = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/result");

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const json = await res.json();

      if (json.status === "processing") {
        setTimeout(fetchResult, 2000);
      } else if (json.error) {
        setError(json.error);
        setLoading(false);
      } else {
        setData(json);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "Unable to load report.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, []);

  const getScoreClass = (score) => {
    if (score >= 90) return 'score-perfect';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-poor';
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container fade-in">
          <div className="spinner"></div>
          <h2 className="text-center mt-4">Analyzing Vulnerabilities...</h2>
          <p className="animate-pulse text-center">Our AI is actively scanning the repository. This might take a few moments.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container fade-in">
        <div className="glass-card text-center border-high" style={{ maxWidth: '600px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2 className="text-high mb-4">Simulation Failed</h2>
          <p className="mb-8">{error}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container fade-in" style={{ alignItems: 'stretch' }}>
      
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="mb-2"><span className="gradient-text">Security Report</span></h1>
          <p className="m-0">AI Attack Simulation Results</p>
        </div>
        <button className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }} onClick={() => navigate('/')}>
           New Scan
        </button>
      </div>

      <div className="grid-2 mb-8 stagger-1">
        {/* SCORE SECTION */}
        <div className="glass-card flex-col items-center justify-center text-center">
          <h2 className="mb-4">Security Score</h2>
          <div className={`stat-large ${getScoreClass(data.score)}`}>
            {data.score}
          </div>
          <p className="mt-4 m-0">out of 100</p>
        </div>

        {/* SUMMARY SECTION */}
        <div className="glass-card flex-col">
           <h2 className="mb-4">Threat Summary</h2>
           <div className="flex-col gap-4">
             <div className="flex justify-between items-center p-0">
               <span className="badge badge-high">Critical</span>
               <span className="text-high" style={{ fontSize: '1.25rem' }}>{data.summary?.critical ?? 0}</span>
             </div>
             <div className="flex justify-between items-center p-0">
               <span className="badge badge-medium">Medium</span>
               <span className="text-medium" style={{ fontSize: '1.25rem' }}>{data.summary?.medium ?? 0}</span>
             </div>
             <div className="flex justify-between items-center p-0">
               <span className="badge badge-low">Low</span>
               <span className="text-low" style={{ fontSize: '1.25rem' }}>{data.summary?.low ?? 0}</span>
             </div>
           </div>
        </div>
      </div>

      {/* OVERALL ANALYSIS */}
      <div className="glass-card mb-8 stagger-2">
        <h2 className="mb-4 flex items-center gap-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          AI Architectural Analysis
        </h2>
        <div className="grid-cards mt-4">
          <div>
            <h4 style={{ color: 'var(--text-primary)' }}>What we found</h4>
            <p>{data.explanation?.what || "No architectural insights."}</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-primary)' }}>Why it matters</h4>
            <p>{data.explanation?.why || "N/A"}</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-primary)' }}>Recommended Fix</h4>
            <p>{data.explanation?.fix || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* VULNERABILITIES */}
      <h2 className="mb-4 mt-8">Detected Vulnerabilities</h2>
      <div className="flex-col gap-6 stagger-3 mb-12">
        {data.details && data.details.length > 0 ? (
          data.details.map((v, i) => {
            let borderClass = "border-low";
            let badgeClass = "badge-low";
            if (v.risk?.toLowerCase() === "high" || v.risk?.toLowerCase() === "critical") { borderClass = "border-high"; badgeClass = "badge-high"; }
            else if (v.risk?.toLowerCase() === "medium") { borderClass = "border-medium"; badgeClass = "badge-medium"; }

            return (
              <div key={i} className={`glass-card ${borderClass}`}>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <h3 className="m-0" style={{ fontSize: '1.25rem' }}>{v.title || `Vulnerability Outline ${i + 1}`}</h3>
                  <span className={`badge ${badgeClass}`}>{v.risk}</span>
                </div>
                
                <p className="mb-4" style={{ color: 'var(--text-primary)' }}>
                  <strong>Description:</strong> {v.description || "No description available"}
                </p>
                <div className="grid-cards mt-4">
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px' }}>
                    <h5 className="mb-2" style={{ color: 'var(--warning)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Impact</h5>
                    <p className="m-0" style={{ fontSize: '0.95rem' }}>{v.why || "This may affect security."}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px' }}>
                    <h5 className="mb-2" style={{ color: 'var(--success)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Remediation</h5>
                    <p className="m-0" style={{ fontSize: '0.95rem' }}>{v.fix || "Apply recommended security fixes."}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-card text-center border-low relative" style={{ overflow: 'hidden' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3 className="text-low mb-2">No Vulnerabilities Found</h3>
            <p className="m-0">Your repository appears to be secure based on the current scan parameters.</p>
          </div>
        )}
      </div>

    </div>
  );
}