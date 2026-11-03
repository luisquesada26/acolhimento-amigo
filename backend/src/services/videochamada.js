const crypto = require("crypto");
const { GOOGLE } = require("../config/env");

// a sala do Google Meet de cada atendimento é um evento na agenda da conta do projeto (acolhimentoamigo@gmail.com)
// sem as três chaves do Google no .env fica desligado, e o agendamento segue sem link
const ligado = Boolean(GOOGLE.clientId && GOOGLE.clientSecret && GOOGLE.refreshToken);

const AGENDA = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const FUSO = "America/Sao_Paulo";

let acesso = { token: null, venceEm: 0 };

// o token de acesso dura uma hora; o refresh token do .env gera outro quando vence
async function token() {
  if (acesso.token && Date.now() < acesso.venceEm) return acesso.token;

  const resposta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE.clientId,
      client_secret: GOOGLE.clientSecret,
      refresh_token: GOOGLE.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    // invalid_grant: a autorização venceu (no modo de teste do Google dura 7 dias)
    const dica = dados.error === "invalid_grant" ? ", rode npm run google:autorizar de novo" : "";
    throw new Error(`autorização do Google recusada (${dados.error}${dica})`);
  }

  acesso = { token: dados.access_token, venceEm: Date.now() + (dados.expires_in - 60) * 1000 };
  return acesso.token;
}

async function chamar(metodo, caminho, corpo) {
  const resposta = await fetch(`${AGENDA}${caminho}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (resposta.status === 204) return null;

  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(`agenda do Google respondeu ${resposta.status}: ${dados.error?.message ?? ""}`);
  return dados;
}

// os e-mails do seed são de mentira: o convite por e-mail só sai com GOOGLE_ENVIAR_CONVITES=true
const avisos = () => `sendUpdates=${GOOGLE.enviarConvites ? "all" : "none"}`;

function periodo({ data, hora_inicio, hora_fim }) {
  return {
    start: { dateTime: `${data}T${hora_inicio}:00`, timeZone: FUSO },
    end: { dateTime: `${data}T${hora_fim}:00`, timeZone: FUSO },
  };
}

function linkDa(evento) {
  return evento.hangoutLink ?? evento.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri;
}

// a sala vem do próprio Google: quem está convidado e logado com aquele e-mail entra sem pedir
async function criarSala(a) {
  const evento = await chamar("POST", `?conferenceDataVersion=1&${avisos()}`, {
    summary: `Acolhimento Amigo · ${a.servico_titulo}`,
    description: `Atendimento de ${a.usuario_nome} com ${a.voluntario_nome}, marcado pelo Acolhimento Amigo.`,
    ...periodo(a),
    attendees: [{ email: a.usuario_email }, { email: a.voluntario_email }],
    guestsCanSeeOtherGuests: false,
    guestsCanInviteOthers: false,
    conferenceData: {
      createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } },
    },
  });

  // a sala às vezes demora um instante para ficar pronta
  let link = linkDa(evento);
  if (!link) {
    await new Promise((pronto) => setTimeout(pronto, 1500));
    link = linkDa(await chamar("GET", `/${evento.id}`));
  }
  if (!link) {
    await apagarSala(evento.id);
    throw new Error("o Google criou o evento mas não a sala do Meet");
  }

  return { link, eventoId: evento.id };
}

// remarcar muda o horário do mesmo evento, e o link continua o mesmo
async function moverSala(eventoId, horario) {
  await chamar("PATCH", `/${eventoId}?${avisos()}`, periodo(horario));
}

async function apagarSala(eventoId) {
  try {
    await chamar("DELETE", `/${eventoId}?${avisos()}`);
  } catch (erro) {
    // já apagado na agenda: não é erro
    if (!/respondeu (404|410)/.test(erro.message)) throw erro;
  }
}

// usado quando o atendimento some junto com o horário ou a conta: tenta cada uma e só registra o que falhar
async function apagarSalas(eventoIds) {
  for (const id of eventoIds) {
    try {
      await apagarSala(id);
    } catch (erro) {
      console.error(`Não consegui apagar a sala ${id} na agenda do Google: ${erro.message}`);
    }
  }
}

module.exports = { ligado, criarSala, moverSala, apagarSala, apagarSalas };
