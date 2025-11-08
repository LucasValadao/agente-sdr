import { useState } from "react";
import axios from "axios";

export default function ChatWidget() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/chat", {
        messages: newMessages,
      });

      setMessages([
        ...newMessages,
        { role: "assistant", content: response.data.reply },
      ]);
    } catch (error) {
      console.error(error);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Desculpe, ocorreu um erro no servidor." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto mt-8 border rounded-lg p-4 shadow bg-white">
      <div className="h-80 overflow-y-auto mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 my-1 rounded ${
              m.role === "user" ? "bg-blue-100" : "bg-gray-200"
            }`}
          >
            <strong>{m.role === "user" ? "Você: " : "Agente: "}</strong>
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="italic text-gray-400">Agente digitando...</div>
        )}
      </div>

      <div className="flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border p-2 rounded-l"
          placeholder="Digite sua mensagem..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}