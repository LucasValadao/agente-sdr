import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // rápido e gratuito

export async function getChatResponse(messages) {
  try {
    // concatena histórico num só prompt
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return response;
  } catch (err) {
    console.error("Erro ao chamar Gemini:", err);
    return "erro ao processar sua solicitação.";
  }
}
