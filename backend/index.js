require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors()); // Fixes CORS issues
app.use(express.json());

const API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// 🔹 API Key Validation Route
app.get("/test-api", async (req, res) => {
  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "mistralai/mistral-7b",
        messages: [{ role: "user", content: "Hello, OpenRouter!" }],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({ message: "✅ API Key is valid!" });
  } catch (error) {
    console.error("❌ OpenRouter API Test Failed:", error?.response?.data || error.message);

    return res.status(500).json({
      error: "❌ API Key is invalid or OpenRouter is down.",
      details: error?.response?.data || "No response from OpenRouter.",
    });
  }
});

// 🔹 Chat Route
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "❌ Message is required." });
  }

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "mistralai/mistral-7b",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      return res.json({ answer: response.data.choices[0].message.content });
    } else {
      throw new Error("Invalid AI response format.");
    }
  } catch (error) {
    console.error("❌ OpenRouter API Error:", error?.response?.data || error.message);

    return res.status(500).json({
      error: "❌ Failed to get AI response.",
      details: error?.response?.data || "No response from OpenRouter.",
    });
  }
});
// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
