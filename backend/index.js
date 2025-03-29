const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.post("/api/chat", async (req, res) => {
    const { question } = req.body;

    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "mistral", // Using OpenRouter's free model
                messages: [{ role: "user", content: question }],
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({ answer: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Error fetching AI response:", error);
        res.status(500).json({ error: "Failed to fetch AI response" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
