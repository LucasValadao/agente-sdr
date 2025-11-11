import { useState, useEffect, useRef } from "react";
import { Send, Bot, User } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function App() {
  const [messages, setMessages] = useState(() => {
    return JSON.parse(localStorage.getItem("chat_history") || "[]");
  });
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const storedId = localStorage.getItem("session_id");
    const expiration = localStorage.getItem("session_expiration");
    const now = Date.now();

    if (!storedId || !expiration || now > Number(expiration)) {
      const newId = uuidv4();
      localStorage.setItem("session_id", newId);
      localStorage.setItem("session_expiration", now + 24 * 60 * 60 * 1000);
      setSessionId(newId);
    } else {
      setSessionId(storedId);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];

    setMessages(newMessages);
    localStorage.setItem("chat_history", JSON.stringify(newMessages));

    setLoading(true);
    setInput("");

    try {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    if (!res.ok) {
      throw new Error(`Erro HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log("payload do backend:", data);
    const resposta =
      typeof data.response === "string" ? data.response :
      typeof data.reply === "string"    ? data.reply    :
      typeof data.message === "string"  ? data.message  :
      "Erro ao responder.";

    const updated = [...newMessages, { role: "assistant", content: resposta }];

    setMessages(updated);
    localStorage.setItem("chat_history", JSON.stringify(updated));
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    const erroMessages = [
      ...messages,
      { role: "assistant", content: "Erro ao conectar com o servidor." },
    ];
    setMessages(erroMessages);
    localStorage.setItem("chat_history", JSON.stringify(erroMessages));
  } finally {
    setLoading(false);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
    if (e.key === "Escape") setInput("");
  };

  return (
    
    <div className="flex flex-col h-screen bg-gradient-to-br from-black-50 via-white to-gray-50 font-sans">
      {/* HEADER */}
      
      <header className="bg-gradient-to-r from-black-600 to-indigo-600 text-white py-4 px-6 shadow-md flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-wide">
          💬 Assistente SDR - Tech
        </h1>
      </header>

      {/* MAIN CHAT */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="flex items-end space-x-2">
                <div className="bg-black-100 rounded-full p-2 shadow-sm">
                  <Bot className="w-4 h-4 text-black-600" />
                </div>
                <div className="bg-gray-200 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm max-w-[75%]">
                  {msg.content}
                </div>
              </div>
            )}

            {msg.role === "user" && (
              <div className="flex items-end space-x-2">
                <div className="bg-black-600 text-white px-4 py-3 rounded-2xl rounded-br-none shadow-sm max-w-[75%]">
                  {msg.content}
                </div>
                <div className="bg-black-100 rounded-full p-2 shadow-sm">
                  <User className="w-4 h-4 text-black-600" />
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-gray-500 text-sm italic animate-pulse">
            <Bot className="w-4 h-4" />
            <span>Assistente digitando...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </main>

      {/* FOOTER */}
      <footer className="flex items-center border-t border-gray-200 p-4 bg-white shadow-inner">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2 focus:ring-2 focus:ring-black-500 focus:outline-none"
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-black-600 hover:bg-black-700 text-white p-2 rounded-full transition disabled:opacity-60"
        >
          <Send size={18} />
        </button>
      </footer>
    </div>
  );
}