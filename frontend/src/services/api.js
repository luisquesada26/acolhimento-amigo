import axios from "axios";
import { API_URL } from "../config";

export const CHAVE_SESSAO = "acolhimento:sessao";

const api = axios.create({ baseURL: API_URL });

// manda o token em toda requisição, se a pessoa estiver logada
api.interceptors.request.use((config) => {
  const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO) || "null");
  if (sessao?.token) {
    config.headers.Authorization = `Bearer ${sessao.token}`;
  }
  return config;
});

// transforma o erro do axios no formato { mensagem, campos } usado nos formulários
export function lerErro(erro) {
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
