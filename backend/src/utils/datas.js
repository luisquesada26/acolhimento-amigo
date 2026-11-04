const { data: dataSchema } = require("../schemas/horariosSchema");
const { ErroApp } = require("../middlewares/erros");

// as datas ficam no horario de Brasilia, sem UTC. O servidor do Vercel roda em UTC e nao deixa trocar o TZ,
// entao a data e a hora sao calculadas no fuso de Sao Paulo, e nao no horario da maquina
const FUSO = "America/Sao_Paulo";

// en-CA escreve a data como AAAA-MM-DD; h23 escreve a meia-noite como 00, e nao 24
const relogio = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function emBrasilia(instante) {
  const p = Object.fromEntries(relogio.formatToParts(instante).map(({ type, value }) => [type, value]));
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

function formatarData(data) {
  return emBrasilia(data).data;
}

// o Brasil nao tem mais horario de verao, entao somar dias inteiros mantem a hora de Brasilia
function diaMais(dias) {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
}

function agora() {
  const { data, hora } = emBrasilia(new Date());
  return { hoje: data, hora };
}

// data que chega na query string
function lerData(valor) {
  if (!valor) return undefined;
  if (!dataSchema.safeParse(valor).success) throw new ErroApp(400, "Data deve estar no formato AAAA-MM-DD");
  return valor;
}

module.exports = { formatarData, diaMais, agora, lerData };
