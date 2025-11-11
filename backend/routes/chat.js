import express from "express";
import { getChatResponse } from "../services/geminiService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Mensagens invalidas." });
    }

    const reply = await getChatResponse(messages);
    res.json({ reply });
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: "Falha ao gerar resposta." });
  }
});

export default router;