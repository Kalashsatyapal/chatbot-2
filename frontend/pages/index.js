import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      if (!res.ok) {
        throw new Error("Server error. Please try again.");
      }
  
      const data = await res.json();
  
      if (data.answer) { // ✅ Fix response format
        setResponse(data.answer);
      } else {
        setResponse("❌ No response from AI.");
      }
    } catch (error) {
      console.error("Error fetching response:", error);
      setResponse("❌ Error: Unable to get response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Q&A Chatbot</h1>
      <div className="w-full max-w-lg p-4 bg-gray-800 rounded-lg shadow">
        <textarea
          className="w-full p-2 text-black rounded border border-gray-400"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          onClick={handleAsk}
          disabled={loading}
        >
          {loading ? "Loading..." : "Ask"}
        </button>
      </div>
      {response && (
        <div className="w-full max-w-lg mt-4 p-4 bg-gray-700 rounded">
          <h2 className="text-lg font-semibold">Answer:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
