const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/scan`, {
      cache: "no-store",
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    console.error("[API Proxy] /scan error:", err.message);
    return Response.json(
      { error: "Backend not reachable. Is backend/server.js running on port 5000?" },
      { status: 502 }
    );
  }
}
