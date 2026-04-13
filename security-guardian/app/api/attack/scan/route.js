const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/attack/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    console.error("[API Proxy] /attack/scan error:", err.message);
    return Response.json(
      { error: "Backend not reachable. Make sure both server.py (port 8000) and backend/server.js (port 5000) are running." },
      { status: 502 }
    );
  }
}
