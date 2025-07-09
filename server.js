// server.js
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  loader as meetingsLoader,
  action as meetingsAction,
} from "./src/routes/meetings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// --- JSON API for debugging ---
app.get("/meetings", async (req, res) => {
  const data = await meetingsLoader();
  res.json(data);
});

// 1) Serve React build
app.use(express.static(path.join(__dirname, "build")));

// 2) SSE endpoint, with proper JSON parsing and meetings data in prompt
app.get("/chat/stream", async (req, res) => {
  const prompt = req.query.prompt || "";

  // Inject meetings into the system prompt
  const meetings = await meetingsLoader();
  const meetingLines = meetings
    .map(
      (m) =>
        `• ${m.time.replace("T", " ")} with ${m.with}${
          m.company ? ` from ${m.company}` : ""
        }${m.notes ? ` — Notes: ${m.notes}` : ""}`
    )
    .join("\n");

  const systemPrompt = `Your name is Donna. You have access to these meetings and their notes:
${meetingLines}
- When the user asks to 'show all notes', return ONLY the notes for all meetings, grouped by person and company if present. If there are no notes, say: "You have no notes saved for any meetings."
- When the user asks about meetings, return the meetings list.
- When the user asks about a specific meeting, use this data only.`;

  // Call OpenAI with streaming enabled
  const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-nano",
      temperature: 0.7,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  // Set SSE response headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Reader for OpenAI’s stream
  const reader = apiRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // Helper to send a single SSE event
  const sendEvent = (data) => {
    res.write(`data: ${data}\n\n`);
  };

  // Read & parse loop
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Append chunk to buffer
    buffer += decoder.decode(value, { stream: true });

    // Split on double-newline (OpenAI uses "\n\n" to separate messages)
    const parts = buffer.split("\n\n");
    buffer = parts.pop(); // last part might be incomplete

    for (const part of parts) {
      // Each part starts with "data: { ... }"
      if (part.startsWith("data:")) {
        const jsonStr = part.replace(/^data:\s*/, "");
        if (jsonStr.trim() === "[DONE]") {
          // Signal end of stream
          sendEvent("[DONE]");
          res.end();
          return;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) sendEvent(delta);
        } catch (err) {
          console.warn("Could not parse JSON chunk", err);
        }
      }
    }
  }

  // In case stream ends without [DONE]
  sendEvent("[DONE]");
  res.end();
});

// 3) Fallback to serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// 4) Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Listening on http://localhost:${PORT}`));
