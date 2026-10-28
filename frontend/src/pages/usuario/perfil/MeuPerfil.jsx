import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { lerErro } from "../../../services/api";
import Avatar from "../../../components/Avatar";
import { Bandeira } from "../../../components/SeletorIdioma";
import { useAuth } from "../../../context/AuthContext";
import { localeAtual, useTextos } from "../../../context/IdiomaContext";
import { Aviso, Campo } from "../../login/Campos";
import { Svg, formatarTelefone } from "../../voluntario/comum";
import { nomeDoIdioma } from "../../voluntario/usePainel";
import { traducoes } from "../traducoes";
import Endereco, { linhasDoEndereco } from "./Endereco";
import { EscolhaIdiomas, FotoPerfil, ListaPaises, validarPerfil } from "./pecasPerfil";
import "./perfil.css";

function desde(criadoEm) {
  if (!criadoEm) return "";
  const d = new Date(criadoEm.replace(" ", "T"));
  return d.toLocaleDateString(localeAtual(), { month: "long", year: "numeric" });
}

function dadosDe(usuario) {
  return {
    nome: usuario.nome ?? "",
    email: usuario.email ?? "",
    telefone: usuario.telefone ?? "",
    pais_origem: usuario.pais_origem ?? "",
    idiomas: usuario.idiomas ?? ["pt"],
    foto: usuario.foto ?? null,
  };
}

function DadosPessoais({ usuario, aoSalvar }) {
  const tudo = useTextos(traducoes);
  const t = tudo.perfil;
  const [dados, setDados] = useState(() => dadosDe(usuario));
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const mudou = JSON.stringify(dados) !== JSON.stringify(dadosDe(usuario));

  function mudar(campo, valor) {
    setSalvo(false);
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setMensagem("");
    const novos = validarPerfil(dados, tudo.erros);
    setErros(novos);
    if (Object.keys(novos).length) return;

    setEnviando(true);
    try {
      const { data } = await api.put("/me", {
        nome: dados.nome.trim(),
        email: dados.email.trim(),
        telefone: dados.telefone.trim(),
        pais_origem: dados.pais_origem.trim(),
        idiomas: dados.idiomas,
        foto: dados.foto,
      });
      aoSalvar(data);
      setDados(dadosDe(data));
      setSalvo(true);
    } catch (problema) {
      const { mensagem: texto, campos } = lerErro(problema);
      setErros(campos);
      setMensagem(texto);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="pf-secao" onSubmit={enviar} noValidate aria-labelledby="pf-dados-titulo">
      <header className="pf-secao-topo">
        <div>
          <h2 id="pf-dados-titulo">{t.dadosTitulo}</h2>
          <p>{t.dadosTexto}</p>
        </div>
      </header>

      <FotoPerfil nome={dados.nome || usuario.nome} foto={dados.foto} aoMudar={(foto) => mudar("foto", foto)} />

      <div className="pf-linha pf-linha-dupla">
        <Campo id="pf-nome" rotulo={t.nome} autoComplete="name" maxLength={100} value={dados.nome} onChange={(e) => mudar("nome", e.target.value)} erro={erros.nome} />
        <Campo id="pf-email" rotulo={t.email} type="email" autoComplete="email" value={dados.email} onChange={(e) => mudar("email", e.target.value)} erro={erros.email} />
        <Campo
          id="pf-telefone"
          rotulo={t.telefone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          value={dados.telefone}
          onChange={(e) => mudar("telefone", e.target.value)}
          erro={erros.telefone}
        />
        <Campo
          id="pf-pais"
          rotulo={t.nacionalidade}
          list="pf-lista-paises"
          autoComplete="country-name"
          maxLength={60}
          value={dados.pais_origem}
          onChange={(e) => mudar("pais_origem", e.target.value)}
          erro={erros.pais_origem}
        />
        <ListaPaises id="pf-lista-paises" />
      </div>

      <EscolhaIdiomas valor={dados.idiomas} aoMudar={(idiomas) => mudar("idiomas", idiomas)} erro={erros.idiomas} />

      <Aviso texto={mensagem} />

      <div className="pf-acoes">
        {salvo && !mudou && (
          <span className="pf-salvo" role="status">
            <Svg nome="check" tamanho={16} /> {t.salvas}
          </span>
        )}
        <button type="button" className="pf-botao-contorno" disabled={!mudou || enviando} onClick={() => setDados(dadosDe(usuario))}>
          {t.desfazer}
        </button>
        <button type="submit" className="botao botao-primario pf-salvar" disabled={!mudou || enviando}>
          {enviando ? t.salvando : t.salvar}
        </button>
      </div>
    </form>
  );
}

function Senha() {
  const tudo = useTextos(traducoes);
  const t = tudo.perfil;
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setSalvo(false);
    if (senha.length < 6) return setErro(tudo.erros.senhaCurta);
    setEnviando(true);
    setErro("");
    try {
      await api.put("/me", { senha });
      setSenha("");
      setSalvo(true);
    } catch (problema) {
      setErro(lerErro(problema).mensagem);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="pf-secao" onSubmit={enviar} noValidate aria-labelledby="pf-senha-titulo">
      <header className="pf-secao-topo">
        <div>
          <h2 id="pf-senha-titulo">{t.senhaTitulo}</h2>
          <p>{t.senhaTexto}</p>
        </div>
      </header>
      <div className="pf-linha pf-linha-senha">
        <Campo id="pf-senha" rotulo={t.novaSenha} type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} erro={erro} />
        <button type="submit" className="pf-botao-contorno pf-senha-botao" disabled={!senha || enviando}>
          {enviando ? t.salvando : t.trocarSenha}
        </button>
      </div>
      {salvo && (
        <span className="pf-salvo" role="status">
          <Svg nome="check" tamanho={16} /> {t.senhaTrocada}
        </span>
      )}
    </form>
  );
}

function ExcluirConta() {
  const t = useTextos(traducoes).perfil;
  const { sair } = useAuth();
  const navigate = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function excluir() {
    setEnviando(true);
    setErro("");
    try {
      await api.delete("/me");
      sair();
      navigate("/login", { replace: true });
    } catch (problema) {
      setErro(lerErro(problema).mensagem);
      setEnviando(false);
    }
  }

  return (
    <section className="pf-secao pf-perigo" aria-labelledby="pf-excluir-titulo">
      <header className="pf-secao-topo">
        <div>
          <h2 id="pf-excluir-titulo">{t.excluirTitulo}</h2>
          <p>{t.excluirTexto}</p>
        </div>
        {!confirmando && (
          <button type="button" className="pf-botao-perigo" onClick={() => setConfirmando(true)}>
            {t.excluirBotao}
          </button>
        )}
      </header>
      {confirmando && (
        <div className="pf-confirmar" role="alertdialog" aria-labelledby="pf-confirmar-texto">
          <p id="pf-confirmar-texto">
            <Svg nome="alerta" tamanho={18} /> {t.excluirConfirmar}
          </p>
          {erro && <span className="campo-erro">{erro}</span>}
          <div className="pf-acoes">
            <button type="button" className="pf-botao-contorno" onClick={() => setConfirmando(false)} disabled={enviando}>
              {t.manter}
            </button>
            <button type="button" className="pf-botao-perigo pf-botao-perigo-cheio" onClick={excluir} disabled={enviando}>
              {enviando ? t.excluindo : t.simExcluir}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function MeuPerfil() {
  const { usuario, atualizarUsuario } = useAuth();
  const tudo = useTextos(traducoes);
  const t = tudo.perfil;
  const navigate = useNavigate();
  const [lido, setLido] = useState(false);

  // volta para a tela de onde a pessoa veio; quem abriu o perfil direto vai para a busca
  function voltar() {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/usuario");
  }

  // a sessão guarda o usuário do dia do login; o perfil mostra o que está no banco agora
  useEffect(() => {
    api
      .get("/me")
      .then(({ data }) => atualizarUsuario(data))
      .catch(() => {})
      .finally(() => setLido(true));
  }, []);

  if (!lido) {
    return (
      <p className="usu-estado" role="status">
        {t.carregando}
      </p>
    );
  }

  const idiomas = usuario.idiomas ?? [];
  const endereco = linhasDoEndereco(usuario);

  return (
    <div className="pf">
      <button type="button" className="usu-voltar pf-voltar" onClick={voltar}>
        <Svg nome="anterior" tamanho={16} /> {t.voltar}
      </button>

      <aside className="pf-cartao">
        <div className="pf-cartao-capa" />
        <Avatar nome={usuario.nome} foto={usuario.foto} className="pf-cartao-avatar" />
        <h2>{usuario.nome}</h2>
        <p className="pf-cartao-email">{usuario.email}</p>
        <ul className="pf-cartao-dados">
          <li>
            <Svg nome="telefone" tamanho={16} />
            {usuario.telefone ? formatarTelefone(usuario.telefone) : t.telefoneNaoInformado}
          </li>
          <li>
            <Svg nome="globo" tamanho={16} />
            {usuario.pais_origem || t.nacionalidadeNaoInformada}
          </li>
          {idiomas.length > 0 && (
            <li>
              <span className="pf-cartao-bandeiras">
                {idiomas.map((codigo) => (
                  <Bandeira key={codigo} codigo={codigo} />
                ))}
              </span>
              {tudo.fala(idiomas.map(nomeDoIdioma))}
            </li>
          )}
          {endereco.length > 0 && (
            <li className="pf-cartao-endereco">
              <Svg nome="local" tamanho={16} />
              <span>
                {endereco.map((linha) => (
                  <span key={linha}>{linha}</span>
                ))}
              </span>
            </li>
          )}
          {usuario.aceite_lgpd && (
            <li>
              <Svg nome="check" tamanho={16} />
              {t.lgpd}
            </li>
          )}
          {usuario.criado_em && (
            <li>
              <Svg nome="agenda" tamanho={16} />
              {t.desde(desde(usuario.criado_em))}
            </li>
          )}
        </ul>
      </aside>

      <div className="pf-conteudo">
        <header className="pf-titulo">
          <h1>{t.titulo}</h1>
          <p>{t.subtitulo}</p>
        </header>
        <DadosPessoais usuario={usuario} aoSalvar={atualizarUsuario} />
        <Endereco usuario={usuario} aoSalvar={atualizarUsuario} />
        <Senha />
        <ExcluirConta />
      </div>
    </div>
  );
}
