import { createContext, useContext, useState } from "react";
import api, { CHAVE_SESSAO } from "../services/api";

const AuthContext = createContext(null);

function lerSessao() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_SESSAO) || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessao);

  function guardar(dados) {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados));
    setSessao(dados);
  }

  async function entrar(email, senha) {
    const { data } = await api.post("/auth/login", { email, senha });
    guardar(data);
    return data.usuario;
  }

  async function cadastrar(dados) {
    const { data } = await api.post("/auth/cadastro", dados);
    guardar(data);
    return data.usuario;
  }

  function sair() {
    localStorage.removeItem(CHAVE_SESSAO);
    setSessao(null);
  }

  const valor = {
    usuario: sessao?.usuario ?? null,
    logado: Boolean(sessao?.token),
    entrar,
    cadastrar,
    sair,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
