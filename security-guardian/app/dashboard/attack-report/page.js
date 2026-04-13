"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, ShieldCheck, ShieldAlert, AlertTriangle,
  ArrowLeft, Zap, Activity, CheckCircle, XCircle,
  Loader2, RefreshCw, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatWidget from "../../components/ChatWidget";

export default function AttackReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Scan input states
  const [repoUrl, setRepoUrl] = useState("");
  const [scanStarted, setScanStarted] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");

  const startScan = async () => {
    if (!repoUrl.trim()) return;

    setScanLoading(true);
    setScanError("");

    try {
      const res = await fetch("/api/attack/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: repoUrl.trim() }),
      });

      const json = await res.json();

      if (json.error) {
        setScanError(json.error);
        setScanLoading(false);
        return;
      }

      // Successfully started, now poll for results
      setScanStarted(true);
      setScanLoading(false);
      setLoading(true);
      setError(null);
      fetchResult();
    } catch (err) {
      console.error(err);
      setScanError("Could not reach the backend. Make sure both server.py (port 8000) and backend/server.js (port 5000) are running.");
      setScanLoading(false);
    }
  };

  const fetchResult = async () => {
    try {
      const res = await fetch("/api/attack/result");

      // Try to parse body regardless of status
      let json;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        // 502 = Python backend unreachable
        const msg = json?.error || (res.status === 502
          ? "Python backend (server.py) is not running on port 8000. Please start it and run a scan from the dashboard first."
          : `Server returned ${res.status}`);
        setError(msg);
        setLoading(false);
        return;
      }

      if (json.status === "processing") {
        setTimeout(fetchResult, 3000);
      } else if (json.error) {
        setError(json.error);
        setLoading(false);
      } else {
        setData(json);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setError("Cannot connect to the backend. Make sure both server.py (port 8000) and backend/server.js (port 5000) are running.");
      setLoading(false);
    }
  };



  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreGlow = (score) => {
    if (score >= 80) return "shadow-green-500/20";
    if (score >= 50) return "shadow-yellow-500/20";
    return "shadow-red-500/20";
  };

  // ===== INITIAL STATE: SCAN INPUT FORM =====
  if (!scanStarted && !data && !loading && !error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 mb-4">
                <Zap className="w-10 h-10 text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Vesper Attack Simulation</h1>
              <p className="text-zinc-400 max-w-md mx-auto">
                Enter a GitHub repository URL to simulate AI-driven attacks and generate a detailed vulnerability report.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/user/repo.git"
                    disabled={scanLoading}
                    className="block w-full pl-10 pr-3 py-3 border border-zinc-700 rounded-xl bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm disabled:opacity-50"
                    onKeyDown={(e) => e.key === "Enter" && startScan()}
                  />
                </div>
                <button
                  onClick={startScan}
                  disabled={!repoUrl.trim() || scanLoading}
                  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {scanLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Start Scan
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {scanError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{scanError}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-zinc-950 text-zinc-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-6">
            <Shield className="w-16 h-16 text-purple-500" />
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin absolute -bottom-1 -right-1" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Analyzing Vulnerabilities...</h2>
          <p className="text-zinc-400 text-center max-w-md">
            Our AI is actively scanning the repository and running attack simulations. This may take a few minutes.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Pipeline active</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-zinc-950 text-zinc-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-lg w-full text-center"
        >
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Simulation Failed</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setScanStarted(false); setError(null); setData(null); }}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              New Scan
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===== MAIN REPORT =====
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      <div className="max-w-5xl mx-auto p-4 md:p-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold tracking-tight">Security Report</h1>
            </div>
            <p className="text-zinc-400">Vesper Attack Simulation Results</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </motion.div>

        {/* Score + Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-lg ${getScoreGlow(data.score)}`}
          >
            <p className="text-sm text-zinc-500 uppercase tracking-wider font-semibold mb-3">Security Score</p>
            <p className={`text-7xl font-bold ${getScoreColor(data.score)}`}>
              {data.score}
            </p>
            <p className="text-zinc-500 mt-2">out of 100</p>
          </motion.div>

          {/* Threat Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
          >
            <p className="text-sm text-zinc-500 uppercase tracking-wider font-semibold mb-5">Threat Summary</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-zinc-300 font-medium">Critical</span>
                </div>
                <span className="text-2xl font-bold text-red-400">{data.summary?.critical ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-zinc-300 font-medium">Medium</span>
                </div>
                <span className="text-2xl font-bold text-yellow-400">{data.summary?.medium ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-zinc-300 font-medium">Low</span>
                </div>
                <span className="text-2xl font-bold text-green-400">{data.summary?.low ?? 0}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold">AI Architectural Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">What We Found</p>
              <p className="text-zinc-300 text-sm leading-relaxed">{data.explanation?.what || "No architectural insights."}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Why It Matters</p>
              <p className="text-zinc-300 text-sm leading-relaxed">{data.explanation?.why || "N/A"}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Recommended Fix</p>
              <p className="text-zinc-300 text-sm leading-relaxed">{data.explanation?.fix || "N/A"}</p>
            </div>
          </div>
        </motion.div>

        {/* Vulnerabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Detected Vulnerabilities
          </h2>

          {data.details && data.details.length > 0 ? (
            <div className="space-y-4">
              {data.details.map((v, i) => {
                let borderColor = "border-l-blue-500";
                let badgeBg = "bg-blue-500/10 border-blue-500/20 text-blue-400";

                if (v.risk?.toLowerCase() === "high" || v.risk?.toLowerCase() === "critical") {
                  borderColor = "border-l-red-500";
                  badgeBg = "bg-red-500/10 border-red-500/20 text-red-400";
                } else if (v.risk?.toLowerCase() === "medium") {
                  borderColor = "border-l-yellow-500";
                  badgeBg = "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
                } else if (v.risk?.toLowerCase() === "low") {
                  borderColor = "border-l-green-500";
                  badgeBg = "bg-green-500/10 border-green-500/20 text-green-400";
                }

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className={`bg-zinc-900 border border-zinc-800 border-l-4 ${borderColor} rounded-2xl p-6`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <h3 className="font-semibold text-lg text-zinc-100">
                        {v.title || `Vulnerability ${i + 1}`}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${badgeBg}`}>
                        {v.risk}
                      </span>
                    </div>

                    <p className="text-zinc-300 text-sm mb-4">
                      {v.description || "No description available"}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs text-yellow-500 uppercase tracking-wider font-semibold mb-1">Impact</p>
                        <p className="text-zinc-400 text-sm">{v.why || "This may affect security."}</p>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs text-green-500 uppercase tracking-wider font-semibold mb-1">Remediation</p>
                        <p className="text-zinc-400 text-sm">{v.fix || "Apply recommended security fixes."}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50 text-green-500" />
              <h3 className="text-lg font-semibold text-green-400 mb-1">No Vulnerabilities Found</h3>
              <p className="text-zinc-500">Your repository appears to be secure based on the current scan parameters.</p>
            </div>
          )}
        </motion.div>

        {/* Footer spacer */}
        <div className="h-16"></div>
      </div>
      <ChatWidget contextData={data} />
    </div>
  );
}
