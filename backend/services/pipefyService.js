import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const PIPEFY_URL = "https://api.pipefy.com/graphql";
const { PIPEFY_TOKEN, PIPEFY_PIPE_ID } = process.env;

export async function registrarLeadPipefy({ nome, email, empresa, interesse, status, horario }) {
  try {
    if (!PIPEFY_TOKEN || !PIPEFY_PIPE_ID) {
      throw new Error("Variaveis nao configuradas no .env");
    }

    const query = `
      mutation {
        createCard(
          input: {
            pipe_id: ${Number(PIPEFY_PIPE_ID)},
            fields_attributes: [
              { field_id: "nome_do_cliente", field_value: "${nome || ""}" },
              { field_id: "email", field_value: "${email || ""}" },
              { field_id: "empresa", field_value: "${empresa || ""}" },
              { field_id: "interesse", field_value: "${interesse || ""}" },
              { field_id: "status", field_value: "${status || "Novo"}" },
              { field_id: "horario", field_value: "${horario || ""}" }
            ]
          }
        ) {
          card {
            id
            title
          }
        }
      }
    `;

    const res = await axios.post(
      PIPEFY_URL,
      { query },
      { headers: { Authorization: `Bearer ${PIPEFY_TOKEN}` } }
    );

    if (res.data.errors) {
      console.error("Erro:", res.data.errors);
      throw new Error(res.data.errors[0].message);
    }

    const card = res.data?.data?.createCard?.card;
    if (!card) throw new Error("Resposta nao mapeada");

    console.log(`Lead registrado: (card #${card.id}):`, card.title);
    return card;
  } catch (err) {
    console.error("Erro ao registrar:", err.message);
    return null;
  }
}
