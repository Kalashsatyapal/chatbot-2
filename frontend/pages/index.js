import { useState, useEffect, useRef } from "react";
import { FiMenu, FiX, FiSend, FiPlus } from "react-icons/fi";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatRef = useRef(null);

  // Function to start a new chat
  const handleNewChat = () => {
    setMessages([]);
  };

  // Function to send messages
  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      const data = await res.json();
      const botMessage = { role: "assistant", content: data.answer || "❌ No response from AI." };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ Error: Unable to get response." }]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-Scrolling to Latest Message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-[#1E293B] shadow-lg transition-transform duration-300 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-80"
        } w-80 p-5 rounded-r-xl`}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-gray-200">Chat History</h2>
          <FiX className="cursor-pointer text-2xl text-gray-400 hover:text-white transition" onClick={() => setSidebarOpen(false)} />
        </div>
        <div className="space-y-3">
          {["Conversation 1", "Conversation 2", "Conversation 3"].map((chat, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-700/60 rounded-lg cursor-pointer hover:bg-gray-600 transition flex items-center gap-2"
            >
              🔹 {chat}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 items-center justify-center p-6">
        {/* Header with Sidebar Toggle & New Chat Button */}
        <div className="w-full max-w-2xl flex items-center justify-between mb-6">
          <FiMenu className="cursor-pointer text-3xl text-gray-300 hover:text-white transition" onClick={() => setSidebarOpen(true)} />
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-md">
            ChatNova AI
          </h1>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-2"
            onClick={handleNewChat}
          >
            <FiPlus /> New Chat
          </button>
        </div>

        {/* Chat Box */}
        <div className="w-full max-w-2xl p-6 bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/60">
          <div
            className="h-[450px] overflow-y-auto p-4 space-y-4 scrollbar-hide"
            ref={chatRef}
            style={{ maxHeight: "500px" }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 text-sm rounded-xl max-w-xs transition-all duration-300 ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white self-end ml-auto shadow-lg"
                    : "bg-gray-700/80 text-gray-300 self-start"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="self-start p-3 bg-gray-700/80 text-gray-300 rounded-xl max-w-xs animate-pulse">
                ChatNova is thinking...
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="mt-4 flex items-center space-x-3">
            <textarea
              className="w-full p-3 text-white bg-gray-800/80 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition-all resize-none placeholder-gray-400"
              placeholder="Type your message here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              className={`bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-md transition-all duration-300 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleAsk}
              disabled={loading}
            >
              <FiSend className="text-2xl" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
