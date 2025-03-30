import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Auth from "../components/Auth";

export default function Home() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) setUser(data.session.user);
    };

    getSession();
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) setUser(session.user);
      else setUser(null);
    });
  }, []);

  const fetchChatHistory = async () => {
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat-history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (data.history) setChatHistory(data.history);
  };

  useEffect(() => {
    if (user) fetchChatHistory();
  }, [user]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError("");

    const token = (await supabase.auth.getSession()).data.session?.access_token;

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setError(data.error);
    } else {
      setChatHistory([{ user_message: message, ai_response: data.answer }, ...chatHistory]);
      setMessage("");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!user) return <Auth onAuthSuccess={setUser} />;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className={`w-64 bg-gray-200 p-4 ${sidebarOpen ? "block" : "hidden"} sm:block` }>
        <h2 className="text-xl font-bold mb-4">Chat History</h2>
        <ul>
          {chatHistory.map((chat, index) => (
            <li key={index} className="p-2 border-b">
              {chat.user_message}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-gray-500 text-white p-2 rounded">
            {sidebarOpen ? "Close" : "History"}
          </button>
          <h1 className="text-2xl font-bold">ChatNova</h1>
          <div>
            <button onClick={() => setChatHistory([])} className="bg-green-500 text-white p-2 rounded mr-2">
              New Chat
            </button>
            <button onClick={handleLogout} className="bg-red-500 text-white p-2 rounded">Logout</button>
          </div>
        </div>

        <div className="border p-4 rounded h-80 overflow-auto bg-gray-100 mb-4">
          {chatHistory.length === 0 ? (
            <p className="text-gray-500">No chat history yet.</p>
          ) : (
            chatHistory.map((chat, index) => (
              <div key={index} className="mb-3">
                <p className="font-semibold">You:</p>
                <p className="bg-white p-2 rounded shadow">{chat.user_message}</p>
                <p className="font-semibold mt-2">AI:</p>
                <p className="bg-blue-100 p-2 rounded shadow">{chat.ai_response}</p>
              </div>
            ))
          )}
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex">
          <input
            type="text"
            className="flex-1 p-2 border rounded"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white p-2 ml-2 rounded"
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
