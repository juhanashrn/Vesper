"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, ShieldAlert, Shield,
  Activity, AlertTriangle, CheckCircle,
  MessageSquare, X, Send, User, Bot, FileText, ExternalLink,
  LogOut, RefreshCw, Zap, Server, Eye, EyeOff,
  ArrowRight
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import ChatWidget from "../components/ChatWidget";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [securityKey, setSecurityKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  // Fetch Dashboard Data
  useEffect(() => {
    const key = localStorage.getItem("securityKey");
    if (!key) {
      router.push("/login");
      return;
    }
    setSecurityKey(key);

    const fetchData = async () => {
      try {
        const backendRes = await fetch("/api/dashboard");
        const backendData = await backendRes.json();

        const { data: threatsData } = await supabase
          .from("threats")
          .select("file_name, line_number, threat_type, code_snippet");

        const filteredThreats = threatsData
          ? threatsData.filter(t => t.line_number && parseInt(t.line_number, 10) >= 1)
          : [];

        const { data: linksData } = await supabase
          .from("team_links")
          .select("*")
          .eq("security_key", key)
          .single();

        setData({
          ...backendData,
          issues: filteredThreats,
          teamLinks: linksData || { test_report_url: null, live_monitoring_url: null }
        });
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      }
    };
    fetchData();
  }, [router]);



  const handleLogout = () => {
    localStorage.removeItem("securityKey");
    router.push("/login");
  };

  const openWithKey = (url) => {
    if (!url) {
      alert("This URL has not been configured yet. Ask your team to add it to the environment config.");
      return;
    }
    navigator.clipboard.writeText(securityKey).catch(() => { });
    window.open(url, "_blank");
  };

  if (!data) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-zinc-950 text-zinc-50">
        <Shield className="w-16 h-16 text-blue-500 animate-pulse mb-4" />
        <p className="text-xl font-medium text-zinc-400 animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  const scoreColor = data.score >= 80 ? "text-green-500" : data.score >= 50 ? "text-yellow-500" : "text-red-500";
  const ScoreIcon = data.score >= 80 ? ShieldCheck : ShieldAlert;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
          <Shield className="w-8 h-8 text-blue-500" />
          <span className="text-xl font-bold tracking-tight">Vesper</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-zinc-800/50 text-white rounded-xl transition-colors">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">Vulnerabilities</span>
          </a>
          <button
            onClick={() => router.push("/dashboard/attack-report")}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800/30 rounded-xl transition-colors"
          >
            <FileText className="w-5 h-5 text-green-400" />
            <span className="font-medium">Test Report</span>
            <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
          </button>
          <button
            onClick={() => openWithKey("https://monitering-dashboard.vercel.app/")}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800/30 rounded-xl transition-colors"
          >
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="font-medium">Live Monitoring</span>
            <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
          </button>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Get your Security Key</p>
            <div className="flex items-center justify-between mt-1 pt-1">
              <p className="text-sm font-mono text-zinc-300 break-all select-all flex-1">
                {showKey ? securityKey : "••••••••••••••••••••••"}
              </p>
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors ml-2"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">


        {/* Vulnerabilities List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4 mt-8">
            <h2 className="text-xl font-semibold tracking-tight">Active Vulnerabilities</h2>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {data.issues.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50 text-green-500" />
                <p>No vulnerabilities found.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {data.issues.map((item, index) => (
                  <div key={index} className="p-6 flex flex-col gap-4 hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500 mt-1">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-100 flex items-center gap-2">
                            {item.file_name || "Unknown File"}
                            <span className="text-zinc-500 text-sm font-normal">Line {item.line_number || "N/A"}</span>
                          </p>
                          <p className="text-sm text-zinc-400 mt-1">Detected Vulnerability</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border bg-red-500/10 border-red-500/20 text-red-400 max-w-[200px] text-center truncate" title={item.threat_type}>
                        {item.threat_type || "Threat"}
                      </span>
                    </div>
                    {item.code_snippet && (
                      <div className="mt-2 bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-x-auto">
                        <pre className="text-sm font-mono text-zinc-300">
                          <code>{item.code_snippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* AI Chat Widget */}
      <ChatWidget contextData={data} />
    </div>
  );
}