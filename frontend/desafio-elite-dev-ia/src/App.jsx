import { useState, useEffect, useRef } from "react";
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
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4"
      aria-label="Assistente virtual"
    >
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl overflow-hidden flex flex-col">
        <header className="bg-blue-600 text-white text-center py-3 font-semibold">
          Assistente SDR - Tech
        </header>

        <main className="flex-1 overflow-y-auto p-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`my-2 p-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-100 text-right"
                  : "bg-gray-200 text-left"
              }`}
              aria-label={
                msg.role === "user"
                  ? "Mensagem do usuário"
                  : "Mensagem do assistente"
              }
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="italic text-gray-500 animate-pulse">
              Assistente digitando...
            </div>
          )}
          <div ref={chatEndRef} />
        </main>

        <footer className="flex p-2 border-t">
          <input
            type="text"
            className="flex-1 border rounded-lg px-2 py-1 focus:outline-none"
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            aria-label="Campo de mensagem"
          />
          <button
            onClick={sendMessage}
            className="ml-2 bg-blue-600 text-white rounded-lg px-4 py-1"
            aria-label="Enviar mensagem"
          >
            Enviar
          </button>
        </footer>
      </div>
    </div>
  );
}
