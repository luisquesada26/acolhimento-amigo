import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paginaInicial, useAuth } from "../../context/AuthContext";
import api, { lerErro } from "../../services/api";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// a API responde em português; estes a tela mostra no idioma da bandeira (ver erros em traducoes.js)
const ERROS_DA_API = {
  "E-mail ou senha incorretos": "loginIncorreto",
  "Este e-mail já está cadastrado": "emailCadastrado",
  "Algo deu errado. Tente de novo.": "generico",
};

function lerErroTraduzivel(erro) {
  const { mensagem, campos } = lerErro(erro);
  if (!erro.response) return { mensagem: "semServidor", campos };
  return { mensagem: ERROS_DA_API[mensagem] ?? mensagem, campos };
}

export function useEntrar() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setMensagem("");

    const novos = {};
    if (!EMAIL_VALIDO.test(email.trim())) novos.email = "emailInvalido";
    if (!senha) novos.senha = "senhaVazia";
    setErros(novos);
    if (Object.keys(novos).length) return;

    setEnviando(true);
    try {
      const usuario = await entrar(email.trim(), senha);
      navigate(paginaInicial(usuario.perfil));
    } catch (erro) {
      const { mensagem: texto, campos } = lerErroTraduzivel(erro);
      setMensagem(texto);
      setErros(campos);
    } finally {
      setEnviando(false);
    }
  }

  return { email, setEmail, senha, setSenha, erros, mensagem, enviando, enviar };
}

export function useCadastro(perfilInicial = "usuario") {
  const { cadastrar } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(perfilInicial);
  const [dados, setDados] = useState({ nome: "", email: "", senha: "", telefone: "" });
  const [areaId, setAreaId] = useState("");
  const [aceite, setAceite] = useState(false);
  const [areas, setAreas] = useState([]);
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  // a lista de áreas só é necessária para o voluntário
  useEffect(() => {
    if (perfil !== "voluntario" || areas.length) return;
    api.get("/areas").then((resposta) => setAreas(resposta.data)).catch(() => setAreas([]));
  }, [perfil, areas.length]);

  function mudar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function validar() {
    const novos = {};
    if (dados.nome.trim().length < 3) novos.nome = "nomeCurto";
    if (!EMAIL_VALIDO.test(dados.email.trim())) novos.email = "emailInvalido";
    if (dados.senha.length < 6) novos.senha = "senhaCurta";
    if (!aceite) novos.aceite_lgpd = "aceiteFaltando";
    if (perfil === "voluntario" && !areaId) {
      novos["voluntario.area_id"] = "areaFaltando";
    }
    return novos;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setMensagem("");

    const novos = validar();
    setErros(novos);
    if (Object.keys(novos).length) return;

    const corpo = {
      nome: dados.nome.trim(),
      email: dados.email.trim(),
      senha: dados.senha,
      telefone: dados.telefone.trim() || null,
      perfil,
      aceite_lgpd: true,
    };
    if (perfil === "voluntario") {
      corpo.voluntario = { area_id: Number(areaId) };
    }

    setEnviando(true);
    try {
      const usuario = await cadastrar(corpo);
      navigate(paginaInicial(usuario.perfil));
    } catch (erro) {
      const { mensagem: texto, campos } = lerErroTraduzivel(erro);
      setMensagem(texto);
      setErros(campos);
    } finally {
      setEnviando(false);
    }
  }

  return {
    perfil,
    setPerfil,
    dados,
    mudar,
    areaId,
    setAreaId,
    aceite,
    setAceite,
    areas,
    erros,
    mensagem,
    enviando,
    enviar,
  };
}
