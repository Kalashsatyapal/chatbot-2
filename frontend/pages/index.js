import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Auth from "../components/Auth";

export default function Home() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false); // Controls sidebar visibility
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) setUser(data.session.user);
    };

    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session ? session.user : null);
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const fetchChatHistory = async () => {
    if (!user) return;

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat-history`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

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
      body: JSON.stringify({ message, chat_id: activeChat }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setError(data.error);
    } else {
      const newChatEntry = { user_message: message, ai_response: data.answer };
      if (activeChat) {
        setChatHistory(
          chatHistory.map((chat) =>
            chat.id === activeChat
              ? { ...chat, messages: [...chat.messages, newChatEntry] }
              : chat
          )
        );
      } else {
        const newChat = {
          id: data.chat_id,
          title: message,
          messages: [newChatEntry],
        };
        setChatHistory([newChat, ...chatHistory]);
        setActiveChat(data.chat_id);
      }
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
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gray-200 p-4 transition-all duration-300 ease-in-out transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } sm:relative sm:translate-x-0`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chat History</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="bg-red-500 text-white p-1 rounded sm:hidden"
          >
            Close
          </button>
        </div>
        <ul>
          {chatHistory.map((chat) => (
            <li
              key={chat.id}
              className={`p-2 border-b cursor-pointer ${
                activeChat === chat.id ? "bg-gray-300" : ""
              }`}
              onClick={() => {
                setActiveChat(chat.id);
                setSidebarOpen(false); // Close sidebar when a chat is selected
              }}
            >
              {chat.title}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 p-4">
        <div className="flex justify-between items-center mb-4">
          {/* Button to toggle sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-gray-500 text-white p-2 rounded"
          >
            {sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          </button>
          <h1 className="text-2xl font-bold">ChatNova</h1>
          <div>
            <button
              onClick={() => {
                setChatHistory([]);
                setActiveChat(null);
              }}
              className="bg-green-500 text-white p-2 rounded mr-2"
            >
              New Chat
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white p-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="border p-4 rounded h-80 overflow-auto bg-gray-100 mb-4">
          {activeChat &&
          chatHistory.find((chat) => chat.id === activeChat)?.messages
            .length ? (
            chatHistory
              .find((chat) => chat.id === activeChat)
              .messages.map((msg, index) => (
                <div key={index} className="mb-3">
                  <p className="font-semibold">You:</p>
                  <p className="bg-white p-2 rounded shadow">
                    {msg.user_message}
                  </p>
                  <p className="font-semibold mt-2">AI:</p>
                  <p className="bg-blue-100 p-2 rounded shadow">
                    {msg.ai_response}
                  </p>
                </div>
              ))
          ) : (
            <p className="text-gray-500">No chat history yet.</p>
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
