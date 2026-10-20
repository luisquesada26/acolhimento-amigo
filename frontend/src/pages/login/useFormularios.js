import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api, { lerErro } from "../../services/api";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    if (!EMAIL_VALIDO.test(email.trim())) novos.email = "Digite um e-mail válido";
    if (!senha) novos.senha = "Digite sua senha";
    setErros(novos);
    if (Object.keys(novos).length) return;

    setEnviando(true);
    try {
      await entrar(email.trim(), senha);
      navigate("/bem-vindo");
    } catch (erro) {
      const { mensagem: texto, campos } = lerErro(erro);
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
    if (dados.nome.trim().length < 3) novos.nome = "Digite seu nome completo";
    if (!EMAIL_VALIDO.test(dados.email.trim())) novos.email = "Digite um e-mail válido";
    if (dados.senha.length < 6) novos.senha = "A senha precisa ter pelo menos 6 caracteres";
    if (!aceite) novos.aceite_lgpd = "É preciso aceitar os termos de privacidade";
    if (perfil === "voluntario" && !areaId) {
      novos["voluntario.area_id"] = "Escolha sua área de atuação";
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
      await cadastrar(corpo);
      navigate("/bem-vindo");
    } catch (erro) {
      const { mensagem: texto, campos } = lerErro(erro);
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
