// Minimal backend proxy so the browser never sees your Anthropic API key.
// Run with: node server/proxy.js  (requires: npm install express cors)
// Then set VITE_CLAUDE_PROXY_URL=http://localhost:8787/api/claude in .env

import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/claude", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy request failed" });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Claude proxy running on http://localhost:${PORT}`));
