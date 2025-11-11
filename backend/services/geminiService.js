import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { registrarLeadPipefy } from "./pipefyService.js";
import { criarConviteCalendly } from "./calendlyService.js";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = "gemini-2.5-flash"; 

const horariosDisponiveis = [
  "amanhã às 10h",
  "amanhã às 15h",
  "segunda-feira às 9h",
  "terça-feira às 14h",
];

function extrairDadosDoLead(messages) {
   if (!Array.isArray(messages)) {
    console.warn("nao eh um array.", messages);
    return "";
  }

  return messages
    .map((m, idx) => {
      const role = (m?.role || "user").toString().toLowerCase();
      const content = m?.content || m?.text || "";

      if (!content.trim()) {
        return "";
      }

      const prefix = role === "assistant" ? "Assistente" : "Usuário";
      return `${prefix}: ${content}`;
    })
    .filter(Boolean)
    .join("\n");
}


export async function getChatResponse(messages) {
  const lead = extrairDadosDoLead(messages);
  const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || "";

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_ID });
    let systemPrompt = `
                        Você é um agente SDR de pré-vendas da empresa Tech.
                        Seu papel é conversar de forma natural e simpática para:
                        - Coletar nome, email, empresa e interesse.
                        - Confirmar se o cliente quer uma reunião.
                        - Sugerir horários disponíveis.
                        - Gerar o link de agendamento quando o cliente confirmar.

                        Use um tom humano, direto e curto. Não repetir perguntas já respondidas.
                        `;

    let respostaFinal = "";

    if (/sim|quero|agendar|reunião/.test(lastMsg)) {
      const horario = horariosDisponiveis[0];
      const agendamento = await criarConviteCalendly(lead, horario);
      respostaFinal = `Agendei sua reuniao para ${agendamento.horario}.
                       Aqui esta o link: ${agendamento.link}
                       Te espero la!`;
      await registrarLeadPipefy({ ...lead, status: "Agendado", horario });
    } else if (lead.nome && !lead.email) {
      respostaFinal = `${lead.nome}! Pode me passar seu e-mail corporativo para enviarmos o convite?`;
    } else if (!lead.nome) {
      respostaFinal = `Ola! Sou assistente da Tech. Qual é seu nome e a sua empresa, por favor?`;
    } else if (lead.email && !lead.interesse) {
      respostaFinal = `Certo, ${lead.nome}! Poderia me contar brevemente o que voce busca melhorar com IA ou automacao?`;
    } else {
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");
      const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
      respostaFinal = result.response.text();
    }

    return respostaFinal;
  } catch (err) {
    console.error("Erro ao chamar Gemini:", err);
    return "Erro ao processar sua solicitacao.";
  }
}