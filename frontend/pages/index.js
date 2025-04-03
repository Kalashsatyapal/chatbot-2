import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaTrashAlt,
  FaPlus,
} from "react-icons/fa";
import Auth from "../components/Auth";
import io from "socket.io-client";

const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`);

export default function Home() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

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

  useEffect(() => {
    if (user) fetchChatHistory();
  }, [user]);

  // Listen for new messages from WebSocket
  useEffect(() => {
    socket.on("new_message", (messageData) => {
      setChatHistory((prevHistory) => {
        const updatedHistory = [...prevHistory];
        const chat = updatedHistory.find(
          (chat) => chat.id === messageData.chat_id
        );
        if (chat) {
          chat.messages.push({
            user_message: messageData.message,
            ai_response: messageData.ai_response,
          });
        }
        return updatedHistory;
      });
    });

    return () => {
      socket.off("new_message");
    };
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

      // Emit message to the backend via WebSocket
      socket.emit("send_message", {
        message,
        ai_response: data.answer,
        chat_id: data.chat_id,
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const deleteChatHistory = async (chatId) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/delete-chat`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );

    const data = await res.json();
    if (data.success) {
      setChatHistory(chatHistory.filter((chat) => chat.id !== chatId));
      if (activeChat === chatId) setActiveChat(null);
    } else {
      setError(data.error || "Failed to delete chat.");
    }
  };

  const formatAIResponse = (response) => {
    // Split the response by punctuation marks (period, exclamation mark, and question mark)
    const sentences = response.split(/(?<=[.!?])\s+/);
    return sentences.map((sentence, index) => <p key={index}>{sentence}</p>);
  };

  if (!user) return <Auth onAuthSuccess={setUser} />;

  return (
    <div
      className={`flex h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gray-200 p-4 transition-all duration-300 ease-in-out transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        } sm:relative sm:translate-x-0`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chat History</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="bg-red-500 text-white p-1 rounded sm:hidden"
          >
            <FaTimes />
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChatHistory(chat.id);
                }}
                className="bg-red-500 text-white text-sm ml-2 p-1 rounded"
              >
                <FaTrashAlt />
              </button>
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
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <h1 className="text-2xl font-bold">ChatNova</h1>
          <div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="bg-gray-700 text-white p-2 rounded mr-2"
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <button
              onClick={() => {
                setChatHistory([]);
                setActiveChat(null);
              }}
              className="bg-green-500 text-white p-2 rounded mr-2"
            >
              <FaPlus />
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white p-2 rounded"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>

        <div
          className={`border p-4 rounded h-150 overflow-auto ${
            darkMode ? "bg-gray-800" : "bg-gray-100"
          } mb-4`}
        >
          {activeChat &&
          chatHistory.find((chat) => chat.id === activeChat)?.messages
            .length ? (
            chatHistory
              .find((chat) => chat.id === activeChat)
              .messages.map((msg, index) => (
                <div key={index} className="mb-3">
                  <div className="flex items-start mb-2">
                    <div className="w-1/6">
                      <div className="font-semibold text-gray-700">You:</div>
                    </div>
                    <div className="w-5/6">
                      <div
                        className={`bg-white p-3 rounded-lg shadow-md ${
                          darkMode ? "bg-gray-700 text-white" : "text-gray-700"
                        }`}
                      >
                        {msg.user_message}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start mb-2">
                    <div className="w-1/6">
                      <div className="font-semibold text-gray-700">AI:</div>
                    </div>
                    <div className="w-5/6">
                      <div
                        className={`bg-blue-200 p-3 rounded-lg shadow-md ${
                          darkMode ? "bg-blue-500 text-white" : "text-gray-700"
                        }`}
                      >
                        {formatAIResponse(msg.ai_response)}
                      </div>
                    </div>
                  </div>
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
            className={`flex-1 p-2 border rounded ${
              darkMode ? "bg-gray-800 text-white border-gray-600" : ""
            }`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white p-2 rounded ml-2"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
