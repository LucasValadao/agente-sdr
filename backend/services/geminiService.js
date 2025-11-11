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
  const texto = messages.map(m => m.content.toLowerCase()).join(" ");
  const lead = {};

  const nomeEempresa =
    texto.match(/meu nome é ([a-záéíóúãõç\s]+)(?: e (?:trabalho (?:na|no|em) )?| da | do )([a-z0-9áéíóúãõç\s]+)/) ||
    texto.match(/sou ([a-záéíóúãõç\s]+) (?:da|do|de) ([a-z0-9áéíóúãõç\s]+)/);

  const nome = texto.match(/meu nome é ([a-záéíóúãõç\s]+)/);
  const email = texto.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
  const empresa = texto.match(/empresa ([a-z0-9áéíóúãõç\s]+)/);
  const interesse = texto.match(/(interessad[oa]|preciso|quero|desejo).{0,30}/);

  if (nomeEempresa) {
    lead.nome = nomeEempresa[1].trim();
    lead.empresa = nomeEempresa[2].trim();
  } else {
    if (nome) lead.nome = nome[1].trim();
    if (empresa) lead.empresa = empresa[1].trim();
  }

  if (email) lead.email = email[0].trim();
  if (interesse) lead.interesse = interesse[0].trim();

  return lead;
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

    if (/agendar|reunião/.test(lastMsg)) {
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