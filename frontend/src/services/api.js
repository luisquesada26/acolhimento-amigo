import axios from "axios";
import { API_URL } from "../config";

export const CHAVE_SESSAO = "acolhimento:sessao";

const api = axios.create({ baseURL: API_URL });

// um GET igual a outro que ainda não voltou reaproveita a mesma resposta em vez de sair de novo.
// Acontece quando duas telas pedem a mesma lista ao mesmo tempo e, em desenvolvimento,
// porque o StrictMode do React monta cada tela duas vezes
const emAndamento = new Map();
const getDaApi = api.get.bind(api);
api.get = (url, config = {}) => {
  const chave = `${url}?${new URLSearchParams(config.params ?? {})}`;
  if (!emAndamento.has(chave)) {
    emAndamento.set(chave, getDaApi(url, config).finally(() => emAndamento.delete(chave)));
  }
  return emAndamento.get(chave);
};

// manda o token em toda requisição, se a pessoa estiver logada
api.interceptors.request.use((config) => {
  const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO) || "null");
  if (sessao?.token) {
    config.headers.Authorization = `Bearer ${sessao.token}`;
  }
  return config;
});

// sessão vencida (o token vale 7 dias) ou inválida: a API responde 401 e a pessoa volta para o login.
// Sem isso o login, que manda quem tem sessão para a sua área, e a área recusada se mandariam um para o outro
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const comSessao = Boolean(erro.config?.headers?.Authorization) && !erro.config.url?.startsWith("/auth/");
    if (erro.response?.status === 401 && comSessao) {
      localStorage.removeItem(CHAVE_SESSAO);
      window.location.replace("/login");
    }
    return Promise.reject(erro);
  }
);

// em desenvolvimento, cada chamada aparece no console do navegador
if (import.meta.env.DEV) {
  api.interceptors.request.use((config) => {
    config.inicio = performance.now();
    return config;
  });

  api.interceptors.response.use(
    (resposta) => {
      registrar(resposta.config, resposta.status, resposta.data);
      return resposta;
    },
    (erro) => {
      if (erro.config) registrar(erro.config, erro.response?.status ?? "sem resposta", erro.response?.data);
      return Promise.reject(erro);
    }
  );
}

// senha e token nunca aparecem no console
function esconder(dados) {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) return dados;
  const copia = { ...dados };
  for (const chave of ["senha", "token"]) {
    if (chave in copia) copia[chave] = "••••••";
  }
  return copia;
}

function registrar(config, status, recebido) {
  const ms = Math.round(performance.now() - (config.inicio ?? performance.now()));
  const deuCerto = typeof status === "number" && status < 400;
  const titulo = `${config.method.toUpperCase()} ${config.url} → ${status} (${ms} ms)`;

  let enviado = config.data;
  try {
    enviado = JSON.parse(config.data);
  } catch {
    // corpo vazio ou que não é JSON: mostra como veio
  }

  console.groupCollapsed(`%c${titulo}`, `color: ${deuCerto ? "#137a43" : "#b42318"}; font-weight: 700`);
  if (enviado) console.log("enviado:", esconder(enviado));
  console.log("recebido:", esconder(recebido));
  console.groupEnd();
}

// transforma o erro do axios no formato { mensagem, campos } usado nos formulários, como a API mandou.
// Os dois textos daqui são chaves do errosApi.js; a tela traduz na hora de mostrar
export function lerErroSemTraduzir(erro) {
  if (!erro.response) {
    return { mensagem: "Não foi possível falar com o servidor. Confira se a API está rodando.", campos: {} };
  }

  const { erro: mensagem, detalhes = [] } = erro.response.data || {};
  const campos = {};
  for (const d of detalhes) {
    if (d.campo && !campos[d.campo]) campos[d.campo] = d.mensagem;
  }
  return { mensagem: mensagem || "Algo deu errado. Tente de novo.", campos };
}

export default api;
