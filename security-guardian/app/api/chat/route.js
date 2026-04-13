export async function POST(request) {
  try {
    const { question, context } = await request.json();

    const systemPrompt = `You are Vesper, the AI assistant of this cybersecurity platform.
Your primary aim is to guide the user to work effectively in our product. Tailor your responses to their current conditions and vulnerabilities. Do not perform any score comparisons.
Here is their current dashboard data:
${JSON.stringify(context)}

Your response must be brief and concise (1-2 sentences maximum). It should satisfy the user request perfectly without extra filler. Keep it highly relevant.`;

    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: systemPrompt + "\n\nUser Question: " + question + "\n\nAI Response:",
        stream: false,
      }),
    });

    if (!res.ok) {
        throw new Error(`Ollama returned status: ${res.status}`);
    }

    const data = await res.json();
    return Response.json({ answer: data.response });
  } catch (err) {
    console.error("[Chat Integration] Llama 3 error:", err.message);
    return Response.json(
      { answer: "Unable to connect to your local AI. Make sure you have Ollama running with: ollama run llama3" },
      { status: 200 }
    );
  }
}
