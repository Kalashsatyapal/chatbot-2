require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ID = "mistralai/mistral-small-3.1-24b-instruct:free";

// Supabase Setup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middleware to verify Supabase Auth token
const verifyUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  req.user = data.user;
  next();
};

// 🔹 Test API Key
app.get("/test-api", async (req, res) => {
  try {
    const response = await axios.post(
      OPENROUTER_URL,
      { model: MODEL_ID, messages: [{ role: "user", content: "Hello" }] },
      { headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" } }
    );

    return res.json({ message: "✅ API Key is valid!" });
  } catch (error) {
    console.error("❌ API Test Failed:", error?.response?.data || error.message);
    return res.status(500).json({ error: "❌ API Key is invalid or OpenRouter is down.", details: error?.response?.data || "No response from OpenRouter." });
  }
});

// 🔹 Chat Route (Requires Authentication)
app.post("/chat", verifyUser, async (req, res) => {
  const { message, chat_id } = req.body;
  const userId = req.user.id;

  if (!message) return res.status(400).json({ error: "❌ Message is required." });

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      { model: MODEL_ID, messages: [{ role: "user", content: message }] },
      { headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" } }
    );

    const aiResponse = response.data.choices?.[0]?.message?.content || "No response";

    if (chat_id) {
      const { data, error } = await supabase
        .from("chats")
        .select("messages")
        .eq("id", chat_id)
        .eq("user_id", userId)
        .single();

      if (error) throw new Error(error.message);

      const updatedMessages = [...data.messages, { user_message: message, ai_response: aiResponse }];
      await supabase.from("chats").update({ messages: updatedMessages }).eq("id", chat_id);

      return res.json({ chat_id, answer: aiResponse });
    } else {
      const { data, error } = await supabase
        .from("chats")
        .insert([{ user_id: userId, messages: [{ user_message: message, ai_response: aiResponse }] }])
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return res.json({ chat_id: data.id, answer: aiResponse });
    }
  } catch (error) {
    console.error("❌ OpenRouter API Error:", error.message);
    return res.status(500).json({ error: "❌ Failed to get AI response." });
  }
});

// 🔹 Fetch Chat History (Requires Authentication)
app.get("/chat-history", verifyUser, async (req, res) => {
  const userId = req.user.id;
  try {
    const { data, error } = await supabase
      .from("chats")
      .select("id, messages, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const chatHistory = data.map((chat) => ({
      id: chat.id,
      title: chat.messages?.[0]?.user_message || "Untitled Chat",
      messages: chat.messages,
    }));

    return res.json({ history: chatHistory });
  } catch (error) {
    console.error("❌ Fetch History Error:", error.message);
    return res.status(500).json({ error: "❌ Failed to fetch chat history." });
  }
});

// 🔹 Delete Chat Route (Requires Authentication)
app.delete("/delete-chat", verifyUser, async (req, res) => {
  const { chat_id } = req.body;
  const userId = req.user.id;

  if (!chat_id) return res.status(400).json({ error: "❌ Chat ID is required." });

  try {
    // Delete the chat from Supabase
    const { data, error } = await supabase
      .from("chats")
      .delete()
      .eq("id", chat_id)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    return res.json({ success: true });
  } catch (error) {
    console.error("❌ Delete Chat Error:", error.message);
    return res.status(500).json({ error: "❌ Failed to delete chat." });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
