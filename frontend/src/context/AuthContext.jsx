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

  // depois do PUT /me, o cabeçalho e o primeiro acesso leem o usuário novo
  function atualizarUsuario(usuario) {
    guardar({ ...sessao, usuario });
  }

  const valor = {
    usuario: sessao?.usuario ?? null,
    logado: Boolean(sessao?.token),
    entrar,
    cadastrar,
    sair,
    atualizarUsuario,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// para onde cada perfil vai depois de entrar
export function paginaInicial(perfil) {
  return perfil === "voluntario" ? "/voluntario" : "/usuario";
}

// o voluntário precisa do contato e da nacionalidade de quem marca; sem eles, o primeiro passo é completar
export function perfilCompleto(usuario) {
  return Boolean(usuario?.telefone && usuario?.pais_origem);
}

export function useAuth() {
  return useContext(AuthContext);
}
