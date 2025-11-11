import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const { CALENDLY_TOKEN, CALENDLY_USER_URI } = process.env;

export async function validarTokenCalendly() {
  try {
    const res = await axios.get("https://api.calendly.com/users/me", {
      headers: { Authorization: `Bearer ${CALENDLY_TOKEN}` },
    });
    console.log("Token Calendly:", res.data.resource.name);
    return res.data.resource.uri;
  } catch (err) {
    console.error("Token invalido:", err.response?.data || err.message);
    return null;
  }
}

export async function criarConviteCalendly(lead, horarioPreferido) {
  try {
    const userUri = CALENDLY_USER_URI || (await validarTokenCalendly());
    if (!userUri) throw new Error("Token invalido ou expirado.");
    const events = await axios.get("https://api.calendly.com/event_types", {
      headers: { Authorization: `Bearer ${CALENDLY_TOKEN}` },
      params: { user: userUri },
    });

    const eventType = events.data.collection?.[0]?.uri;

    if (!eventType) {
      console.warn("Nenhum tipo de evento encontrado.");
      return {
        link: "https://calendly.com/lukasfv10",
        horario: horarioPreferido || "a combinar",
      };
    }

    console.log("Evento padrao:", eventType);

    const agendamento = {
      link: `https://calendly.com/lukasfv10/${lead.nome?.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      horario: horarioPreferido || "a combinar",
    };

    console.log("Agendamento criado:", agendamento);
    return agendamento;
  } catch (err) {
    console.error("Erro ao agendar:", err.response?.data || err.message);
    return null;
  }
}
