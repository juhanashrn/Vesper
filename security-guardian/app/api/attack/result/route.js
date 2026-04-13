const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export const maxDuration = 120; // Allow up to 2 min for this route

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 70000); // 70s timeout

    const res = await fetch(`${BACKEND_URL}/attack/result`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json();

    if (!res.ok) {
      return Response.json(data, { status: res.status });
    }

    return Response.json(data);
  } catch (err) {
    console.error("[API Proxy] /attack/result error:", err.message);

    if (err.name === "AbortError") {
      return Response.json({ status: "processing" });
    }

    return Response.json(
      { error: "Backend not reachable. Make sure both server.py (port 8000) and backend/server.js (port 5000) are running." },
      { status: 502 }
    );
  }
}
