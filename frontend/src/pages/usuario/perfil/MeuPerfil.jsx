import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { lerErro } from "../../../services/api";
import Avatar from "../../../components/Avatar";
import { Bandeira } from "../../../components/SeletorIdioma";
import { useAuth } from "../../../context/AuthContext";
import { Aviso, Campo } from "../../login/Campos";
import { Svg, formatarTelefone } from "../../voluntario/comum";
import { EscolhaIdioma, FotoPerfil, IDIOMAS_PERFIL, ListaPaises, validarPerfil } from "./pecasPerfil";
import "./perfil.css";

function desde(criadoEm) {
  if (!criadoEm) return "";
  const d = new Date(criadoEm.replace(" ", "T"));
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function dadosDe(usuario) {
  return {
    nome: usuario.nome ?? "",
    telefone: usuario.telefone ?? "",
    pais_origem: usuario.pais_origem ?? "",
    idioma: usuario.idioma ?? "pt",
    foto: usuario.foto ?? null,
  };
}

function DadosPessoais({ usuario, aoSalvar }) {
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
    const novos = validarPerfil(dados);
    setErros(novos);
    if (Object.keys(novos).length) return;

    setEnviando(true);
    try {
      const { data } = await api.put("/me", {
        nome: dados.nome.trim(),
        telefone: dados.telefone.trim(),
        pais_origem: dados.pais_origem.trim(),
        idioma: dados.idioma,
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
          <h2 id="pf-dados-titulo">Dados pessoais</h2>
          <p>O voluntário vê esses dados quando você marca um atendimento.</p>
        </div>
      </header>

      <FotoPerfil nome={dados.nome || usuario.nome} foto={dados.foto} aoMudar={(foto) => mudar("foto", foto)} />

      <div className="pf-linha">
        <Campo id="pf-nome" rotulo="Nome completo" autoComplete="name" maxLength={100} value={dados.nome} onChange={(e) => mudar("nome", e.target.value)} erro={erros.nome} />
        <Campo
          id="pf-telefone"
          rotulo="Telefone ou WhatsApp"
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
          rotulo="País de origem"
          list="pf-lista-paises"
          autoComplete="country-name"
          maxLength={60}
          value={dados.pais_origem}
          onChange={(e) => mudar("pais_origem", e.target.value)}
          erro={erros.pais_origem}
        />
        <ListaPaises id="pf-lista-paises" />
      </div>

      <EscolhaIdioma valor={dados.idioma} aoMudar={(idioma) => mudar("idioma", idioma)} />

      <Aviso texto={mensagem} />

      <div className="pf-acoes">
        {salvo && !mudou && (
          <span className="pf-salvo" role="status">
            <Svg nome="check" tamanho={16} /> Alterações salvas
          </span>
        )}
        <button type="button" className="pf-botao-contorno" disabled={!mudou || enviando} onClick={() => setDados(dadosDe(usuario))}>
          Desfazer
        </button>
        <button type="submit" className="botao botao-primario pf-salvar" disabled={!mudou || enviando}>
          {enviando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

function Senha() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setSalvo(false);
    if (senha.length < 6) return setErro("A senha precisa ter pelo menos 6 caracteres");
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
          <h2 id="pf-senha-titulo">Senha</h2>
          <p>Use pelo menos 6 caracteres.</p>
        </div>
      </header>
      <div className="pf-linha pf-linha-senha">
        <Campo id="pf-senha" rotulo="Nova senha" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} erro={erro} />
        <button type="submit" className="pf-botao-contorno pf-senha-botao" disabled={!senha || enviando}>
          {enviando ? "Salvando..." : "Trocar senha"}
        </button>
      </div>
      {salvo && (
        <span className="pf-salvo" role="status">
          <Svg nome="check" tamanho={16} /> Senha trocada
        </span>
      )}
    </form>
  );
}

function ExcluirConta() {
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
          <h2 id="pf-excluir-titulo">Excluir conta</h2>
          <p>Apaga seus dados e cancela os atendimentos marcados. Não dá para desfazer.</p>
        </div>
        {!confirmando && (
          <button type="button" className="pf-botao-perigo" onClick={() => setConfirmando(true)}>
            Excluir minha conta
          </button>
        )}
      </header>
      {confirmando && (
        <div className="pf-confirmar" role="alertdialog" aria-labelledby="pf-confirmar-texto">
          <p id="pf-confirmar-texto">
            <Svg nome="alerta" tamanho={18} /> Tem certeza? Os voluntários com quem você marcou vão ver o atendimento cancelado.
          </p>
          {erro && <span className="campo-erro">{erro}</span>}
          <div className="pf-acoes">
            <button type="button" className="pf-botao-contorno" onClick={() => setConfirmando(false)} disabled={enviando}>
              Manter minha conta
            </button>
            <button type="button" className="pf-botao-perigo pf-botao-perigo-cheio" onClick={excluir} disabled={enviando}>
              {enviando ? "Excluindo..." : "Sim, excluir"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function MeuPerfil() {
  const { usuario, atualizarUsuario } = useAuth();
  const idioma = IDIOMAS_PERFIL.find((i) => i.codigo === usuario.idioma);

  return (
    <div className="pf">
      <aside className="pf-cartao">
        <div className="pf-cartao-capa" />
        <Avatar nome={usuario.nome} foto={usuario.foto} className="pf-cartao-avatar" />
        <h2>{usuario.nome}</h2>
        <p className="pf-cartao-email">{usuario.email}</p>
        <ul className="pf-cartao-dados">
          <li>
            <Svg nome="telefone" tamanho={16} />
            {usuario.telefone ? formatarTelefone(usuario.telefone) : "Telefone não informado"}
          </li>
          <li>
            <Svg nome="globo" tamanho={16} />
            {usuario.pais_origem || "País não informado"}
          </li>
          {idioma && (
            <li>
              <Bandeira codigo={idioma.codigo} />
              Atendimento em {idioma.nome}
            </li>
          )}
          {usuario.criado_em && (
            <li>
              <Svg nome="agenda" tamanho={16} />
              No Acolhimento Amigo desde {desde(usuario.criado_em)}
            </li>
          )}
        </ul>
      </aside>

      <div className="pf-conteudo">
        <header className="pf-titulo">
          <h1>Meu perfil</h1>
          <p>Seus dados, sua senha e sua conta.</p>
        </header>
        <DadosPessoais usuario={usuario} aoSalvar={atualizarUsuario} />
        <Senha />
        <ExcluirConta />
      </div>
    </div>
  );
}
