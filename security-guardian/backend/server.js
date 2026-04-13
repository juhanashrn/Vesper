require("dotenv").config();

const express = require("express");
const cors = require("cors");
const RAGPipeline = require("./rag/pipeline");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the RAG Pipeline
const rag = new RAGPipeline();

// Check Ollama on startup
rag.checkOllama().then((ok) => {
  if (ok) {
    console.log("✅ Ollama + LLaMA 3 ready for RAG pipeline.");
  } else {
    console.warn("⚠ Ollama not detected. Chat will not work until Ollama is running.");
    console.warn("  Install: https://ollama.com/download");
    console.warn("  Then run: ollama pull llama3 && ollama serve");
  }
});

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Backend is running with local RAG pipeline 🚀");
});

// SIGNUP (kept for backward compatibility, actual signup now uses Supabase directly)
app.post("/signup", (req, res) => {
  const { name, email, company, product } = req.body;
  const key = "COMP-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  res.json({ message: "Signup successful", securityKey: key });
});

// DASHBOARD
app.get("/dashboard", (req, res) => {
  res.json({
    score: 82,
    issues: [],
  });
});

// SCAN
app.get("/scan", (req, res) => {
  res.json({
    score: Math.floor(Math.random() * 100),
    message: "New scan completed",
  });
});

// RAG INGEST — Trigger data indexing for a security key
app.post("/rag/ingest", async (req, res) => {
  const { securityKey } = req.body;

  if (!securityKey) {
    return res.status(400).json({ error: "securityKey is required" });
  }

  try {
    await rag.ingest(securityKey);
    res.json({ message: `Ingestion complete for key: ${securityKey}` });
  } catch (err) {
    console.error("Ingestion error:", err);
    res.status(500).json({ error: "Ingestion failed: " + err.message });
  }
});

// AI CHAT — RAG-powered chat
app.post("/chat", async (req, res) => {
  const { question, context, securityKey } = req.body;

  if (!question) {
    return res.json({ answer: "Please ask a question." });
  }

  try {
    const key = securityKey || "UNKNOWN";
    const answer = await rag.query(question, key, context || {});

    res.json({ answer });
  } catch (err) {
    console.error("RAG query error:", err);
    res.json({
      answer: "The AI could not process your request. Make sure Ollama is running locally with: ollama serve",
    });
  }
});

// ===== ATTACK SIMULATION PROXY =====
const PYTHON_URL = "http://127.0.0.1:8000";

// POST /attack/scan → Python POST /scan
app.post("/attack/scan", async (req, res) => {
  try {
    console.log("[PROXY] POST /attack/scan →", PYTHON_URL + "/scan", req.body);
    const pyRes = await fetch(PYTHON_URL + "/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await pyRes.json();
    console.log("[PROXY] Python responded:", data);
    res.json(data);
  } catch (err) {
    console.error("[PROXY] Attack scan error:", err.message);
    res.status(502).json({ error: "Python backend not reachable at " + PYTHON_URL + ". Is server.py running?" });
  }
});

// GET /attack/result → Python GET /result
app.get("/attack/result", async (req, res) => {
  try {
    console.log("[PROXY] GET /attack/result →", PYTHON_URL + "/result");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 65000); // 65s timeout (Python waits up to 60s)
    const pyRes = await fetch(PYTHON_URL + "/result", { signal: controller.signal });
    clearTimeout(timeout);
    const data = await pyRes.json();
    console.log("[PROXY] Python responded:", JSON.stringify(data).substring(0, 200));
    res.json(data);
  } catch (err) {
    console.error("[PROXY] Attack result error:", err.message);
    if (err.name === "AbortError") {
      res.json({ status: "processing" });
    } else {
      res.status(502).json({ error: "Python backend not reachable at " + PYTHON_URL + ". Is server.py running?" });
    }
  }
});

// START SERVER
app.listen(5000, () => {
  console.log("Server running on port 5000");
  console.log("Attack simulation proxy: /attack/scan → Python :8000/scan");
  console.log("Attack simulation proxy: /attack/result → Python :8000/result");
});