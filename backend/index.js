require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ✅ API Key Test Endpoint
app.get('/test-api', async (req, res) => {
    try {
        const response = await axios.post(
            OPENROUTER_URL,
            {
                model: "mistralai/mistral-7b",
                messages: [{ role: "user", content: "Test connection" }]
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data && response.data.choices) {
            return res.json({ success: true, message: "API Key is valid and working!" });
        } else {
            throw new Error("Invalid response from OpenRouter API.");
        }
    } catch (error) {
        console.error("API Test Error:", error.response ? error.response.data : error.message);

        if (error.response && error.response.status === 401) {
            return res.status(401).json({ error: "Invalid API key. Please check your OpenRouter API key." });
        }

        res.status(500).json({ error: "Failed to verify API key. OpenRouter may be down." });
    }
});

// ✅ Chat Endpoint
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const response = await axios.post(
            OPENROUTER_URL,
            {
                model: "mistralai/mistral-7b",
                messages: [{ role: "user", content: message }]
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.data || !response.data.choices) {
            throw new Error("Invalid response from OpenRouter");
        }

        res.json(response.data.choices[0].message);
    } catch (error) {
        console.error("Chat Error:", error.response ? error.response.data : error.message);

        if (error.response && error.response.status === 401) {
            return res.status(401).json({ error: "Invalid API key. Check your OpenRouter API key." });
        }

        res.status(500).json({ error: "Failed to fetch response from OpenRouter API" });
    }
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
