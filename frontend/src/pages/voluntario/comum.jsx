import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { localeAtual, textosAtuais, useTextos } from "../../context/IdiomaContext";
import { traducoes } from "./traducoes";
import Avatar from "../../components/Avatar";
import BotaoVideochamada from "../../components/BotaoVideochamada";
import "./comum.css";

// peças do painel que as três opções usam

export function primeiroNome(nome) {
  return nome.split(" ")[0];
}

export function iniciais(nome) {
  const partes = nome.trim().split(" ");
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export function hojeExtenso() {
  return new Date().toLocaleDateString(localeAtual(), { weekday: "long", day: "numeric", month: "long" });
}

export function diaExtenso(data) {
  return data.toLocaleDateString(localeAtual(), { weekday: "long", day: "numeric", month: "long" });
}

export function diaCurto(data) {
  return data.toLocaleDateString(localeAtual(), { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "");
}

// "Qua, 28/10/2026"
export function dataComAno(data) {
  const texto = data.toLocaleDateString(localeAtual(), { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).replace(".", "");
  return texto[0].toUpperCase() + texto.slice(1);
}

// cabeçalho "Data" que alterna entre mais recentes e mais antigos primeiro
export function OrdenarPorData({ ordem, aoMudar }) {
  const t = useTextos(traducoes);
  return (
    <button
      type="button"
      className="vol-ordenar"
      onClick={() => aoMudar(ordem === "desc" ? "asc" : "desc")}
      title={ordem === "desc" ? t.maisRecentes : t.maisAntigos}
    >
      {t.data} <Svg nome={ordem === "desc" ? "setaBaixo" : "setaCima"} tamanho={14} />
    </button>
  );
}

// "7h30" em português, "7h 30m" em inglês: o formato vem das traduções (horas)
export function formatarHoras(minutos) {
  return textosAtuais(traducoes).horas(Math.floor(minutos / 60), Math.round(minutos % 60));
}

// "Hoje", "Amanhã", "Em 3 dias", no idioma da bandeira (quando, nas traduções)
export function quando(data) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dia = new Date(data);
  dia.setHours(0, 0, 0, 0);
  const dias = Math.round((dia - hoje) / 86400000);

  const t = textosAtuais(traducoes).quando;
  if (dias === 0) return t.hoje;
  if (dias === 1) return t.amanha;
  if (dias === -1) return t.ontem;
  if (dias > 1 && dias < 14) return t.emDias(dias);
  if (dias >= 14) return t.emSemanas(Math.round(dias / 7));
  return t.haDias(-dias);
}

function Icone({ d, tamanho = 20 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export const icones = {
  painel: "M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z",
  agenda: "M4 5h16v16H4z M4 10h16 M9 3v4 M15 3v4",
  atendimentos: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  servicos: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
  perfil: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8z",
  sair: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18 M6 6l12 12",
  relogio: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z M12 6v6l4 2",
  pessoas: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
  alerta: "M12 9v4 M12 17h.01 M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  idioma: "M5 8l6 6 M4 14l6-6 2-3 M2 5h12 M7 2h1 M22 22l-5-10-5 10 M14 18h6",
  local: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6a3 3 0 1 0 0-6z",
  mais: "M12 5v14 M5 12h14",
  recolher: "M11 17l-5-5 5-5 M18 17l-5-5 5-5",
  expandir: "M13 17l5-5-5-5 M6 17l5-5-5-5",
  editar: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  lixo: "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6 M10 11v6 M14 11v6",
  video: "M23 7l-7 5 7 5z M1 5h15v14H1z",
  anterior: "M15 18l-6-6 6-6",
  setaBaixo: "M12 5v14 M19 12l-7 7-7-7",
  setaCima: "M12 19V5 M5 12l7-7 7 7",
  telefone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  email: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6",
  globo: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z M2 12h20 M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z",
  texto: "M4 6h16 M4 12h16 M4 18h10",
  maleta: "M2 7h20v14H2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
  registro: "M3 5h18v14H3z M7 15h4 M7 11h10",
  proximo: "M9 18l6-6-6-6",
  descer: "M6 9l6 6 6-6",
  relatorio: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8 M8 9h2",
  busca: "M11 3a8 8 0 1 0 0 16a8 8 0 1 0 0-16z M21 21l-4.3-4.3",
};

export function Svg({ nome, tamanho }) {
  return <Icone d={icones[nome]} tamanho={tamanho} />;
}

// o nome de cada item vem das traduções pelo ícone (menu) e o de cada grupo pela chave (grupos)
export const NAVEGACAO = [
  { icone: "painel", caminho: "/voluntario", grupo: "trabalho" },
  { icone: "agenda", caminho: "/voluntario/agenda", grupo: "trabalho" },
  { icone: "atendimentos", caminho: "/voluntario/atendimentos", grupo: "trabalho" },
  { icone: "relatorio", caminho: "/voluntario/relatorios", grupo: "trabalho" },
  { icone: "perfil", caminho: "/voluntario/perfil", grupo: "conta" },
];

// onde resolver cada pendência do perfil; o texto do link fica nas traduções
const ONDE_RESOLVER = {
  perfil: "/voluntario/perfil",
  servico: "/voluntario/perfil?aba=servicos",
  horario: "/voluntario/perfil?aba=agenda",
};

// botão que chama a API, mostra o erro ao lado e fica travado enquanto espera
export function useAcao(acao) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function executar() {
    setOcupado(true);
    setErro("");
    const mensagem = await acao();
    setOcupado(false);
    if (mensagem) setErro(mensagem);
  }

  return { executar, ocupado, erro };
}

// as duas saídas de um atendimento: concluir (vai para o histórico, com a anotação) ou cancelar.
// fechado, mostra os dois botões; escolhido um, o outro some e o painel abre na largura toda.
// "Voltar" desfaz a escolha e devolve o foco ao botão de onde o painel saiu
export function AcoesAtendimento({ id, marcarRealizado, cancelar, rotuloConcluir, rotuloCancelar, rotuloSimCancelar, perguntaCancelar }) {
  const t = useTextos(traducoes);
  const [aberto, setAberto] = useState(null); // null, "concluir" ou "cancelar"
  const [voltouDe, setVoltouDe] = useState(null);
  const [anotacao, setAnotacao] = useState("");
  const concluir = useAcao(() => marcarRealizado(id, anotacao));
  const desmarcar = useAcao(() => cancelar(id));
  const campo = useId();
  const pergunta = useId();
  // a cada troca, o foco vai para o campo da anotação, para a pergunta ou de volta ao botão
  const foco = useRef(null);

  useEffect(() => {
    foco.current?.focus();
  }, [aberto]);

  function voltar() {
    setVoltouDe(aberto);
    setAberto(null);
  }

  if (aberto === "concluir") {
    return (
      <div className="vol-confirmar vol-confirmar-concluir vol-atendimento-painel">
        <label htmlFor={campo}>{t.anotacaoOpcional}</label>
        <textarea
          ref={foco}
          id={campo}
          rows={3}
          maxLength={1000}
          value={anotacao}
          onChange={(e) => setAnotacao(e.target.value)}
          placeholder={t.anotacaoPlaceholder}
        />
        <div className="vol-acoes">
          <button type="button" className="botao botao-primario botao-voluntario vol-botao-pequeno" onClick={concluir.executar} disabled={concluir.ocupado}>
            {concluir.ocupado ? t.concluindo : t.concluirAtendimento}
          </button>
          <button type="button" className="vol-botao-secundario" onClick={voltar} disabled={concluir.ocupado}>
            {t.voltar}
          </button>
        </div>
        {concluir.erro && <p className="vol-erro" role="alert">{concluir.erro}</p>}
      </div>
    );
  }

  if (aberto === "cancelar") {
    return (
      <div ref={foco} className="vol-confirmar vol-atendimento-painel" role="group" aria-labelledby={pergunta} tabIndex={-1}>
        <p id={pergunta}>{perguntaCancelar ?? t.cancelarMesmo}</p>
        <div className="vol-acoes">
          <button type="button" className="vol-botao-perigo vol-botao-cheio" onClick={desmarcar.executar} disabled={desmarcar.ocupado}>
            {desmarcar.ocupado ? t.cancelando : (rotuloSimCancelar ?? t.simCancelar)}
          </button>
          <button type="button" className="vol-botao-secundario" onClick={voltar} disabled={desmarcar.ocupado}>
            {t.voltar}
          </button>
        </div>
        {desmarcar.erro && <p className="vol-erro" role="alert">{desmarcar.erro}</p>}
      </div>
    );
  }

  return (
    <div className="vol-atendimento-botoes">
      <button
        ref={voltouDe === "concluir" ? foco : null}
        type="button"
        className="vol-botao-secundario vol-botao-concluir"
        onClick={() => setAberto("concluir")}
      >
        <Svg nome="check" tamanho={18} /> {rotuloConcluir ?? t.concluirAtendimento}
      </button>
      <button ref={voltouDe === "cancelar" ? foco : null} type="button" className="vol-botao-perigo" onClick={() => setAberto("cancelar")}>
        {rotuloCancelar ?? t.cancelarAtendimento}
      </button>
    </div>
  );
}

export function Status({ status }) {
  const t = useTextos(traducoes);
  if (status === "realizado") {
    return (
      <span className="vol-status vol-status-realizado">
        <Svg nome="check" tamanho={14} /> {t.status.realizado}
      </span>
    );
  }
  if (status === "cancelado") {
    return (
      <span className="vol-status vol-status-cancelado">
        <Svg nome="x" tamanho={14} /> {t.status.cancelado}
      </span>
    );
  }
  return (
    <span className="vol-status vol-status-confirmado">
      <Svg nome="relogio" tamanho={14} /> {t.status.confirmado}
    </span>
  );
}

// "11987654321" vira "(11) 98765-4321"
export function formatarTelefone(numero) {
  const d = String(numero).replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return numero;
}

// quem marcou: nome e os dados para o voluntário entrar em contato
export function Pessoa({ usuario }) {
  const t = useTextos(traducoes);
  const fala = t.fala(usuario.idiomas);
  return (
    <div className="vol-pessoa">
      <span className="vol-pessoa-nome">
        <Avatar nome={usuario.nome} foto={usuario.foto} className="vol-pessoa-avatar" />
        <strong>{usuario.nome}</strong>
      </span>
      <ul className="vol-contato">
        <li>
          <Svg nome="globo" tamanho={15} /> {usuario.pais_origem || t.semNacionalidade}
        </li>
        <li>
          <Svg nome="idioma" tamanho={15} /> {fala[0].toUpperCase() + fala.slice(1)}
        </li>
        <li>
          <Svg nome="telefone" tamanho={15} />{" "}
          {usuario.telefone ? <a href={`tel:${usuario.telefone}`}>{formatarTelefone(usuario.telefone)}</a> : t.semTelefone}
        </li>
        {usuario.email && (
          <li>
            <Svg nome="email" tamanho={15} /> <a href={`mailto:${usuario.email}`}>{usuario.email}</a>
          </li>
        )}
      </ul>
    </div>
  );
}

// o rótulo de cada número vem das traduções, pela chave
const NUMEROS = [
  { chave: "realizados", icone: "check" },
  { chave: "pessoas", icone: "pessoas" },
  { chave: "minutos", icone: "relogio", formato: formatarHoras },
  { chave: "marcados", icone: "agenda" },
  { chave: "livres", icone: "mais" },
];

export function Numeros({ numeros }) {
  const t = useTextos(traducoes);
  return (
    <ul className="vol-numeros vol-numeros-cartoes">
      {NUMEROS.map((n) => (
        <li key={n.chave}>
          <span className="vol-numero-icone">
            <Svg nome={n.icone} />
          </span>
          <strong>{n.formato ? n.formato(numeros[n.chave]) : numeros[n.chave]}</strong>
          <span>{t.numeros[n.chave]}</span>
        </li>
      ))}
    </ul>
  );
}

export function Aguardando({ itens, marcarRealizado, cancelar }) {
  const t = useTextos(traducoes);
  if (!itens.length) return null;

  return (
    <section className="vol-aguardando" aria-labelledby="vol-aguardando-titulo">
      <h2 id="vol-aguardando-titulo">
        <Svg nome="alerta" /> {t.precisaConfirmacao}
      </h2>
      <ul>
        {itens.map((a) => (
          <ItemAguardando key={a.id} atendimento={a} marcarRealizado={marcarRealizado} cancelar={cancelar} />
        ))}
      </ul>
    </section>
  );
}

function ItemAguardando({ atendimento, marcarRealizado, cancelar }) {
  const t = useTextos(traducoes);

  return (
    <li>
      <p>
        {t.aguardando(
          <time key="dia" dateTime={atendimento.horario.data}>
            {diaExtenso(atendimento.inicio)}
          </time>,
          atendimento.horario.hora_inicio,
          <strong key="nome">{atendimento.usuario.nome}</strong>
        )}
      </p>
      <AcoesAtendimento
        id={atendimento.id}
        marcarRealizado={marcarRealizado}
        cancelar={cancelar}
        rotuloConcluir={t.marcarRealizado}
        rotuloCancelar={t.naoAconteceu}
        rotuloSimCancelar={t.simNaoAconteceu}
        perguntaCancelar={t.naoAconteceuMesmo}
      />
    </li>
  );
}

export function ProximoAtendimento({ atendimento, cancelar, marcarRealizado, aoAtualizar, titulo: tituloRecebido }) {
  const t = useTextos(traducoes);
  const titulo = tituloRecebido ?? t.proximoAtendimento;
  if (!atendimento) {
    return (
      <section className="vol-proximo vol-proximo-vazio" aria-labelledby="vol-proximo-titulo">
        <h2 id="vol-proximo-titulo">{titulo}</h2>
        <p>{t.nenhumMarcado}</p>
      </section>
    );
  }

  return (
    <section className="vol-proximo" aria-labelledby="vol-proximo-titulo">
      <div className="vol-proximo-cabeca">
        <div className="vol-proximo-info">
          <h2 id="vol-proximo-titulo">{titulo}</h2>
          <p className="vol-proximo-hora">
            <time dateTime={`${atendimento.horario.data}T${atendimento.horario.hora_inicio}`}>
              {diaExtenso(atendimento.inicio)}, {t.das(atendimento.horario.hora_inicio, atendimento.horario.hora_fim)}
            </time>
          </p>
          <Pessoa usuario={atendimento.usuario} />
          <p className="vol-servico">{atendimento.servico.titulo}</p>
        </div>
        <div className="vol-proximo-lado">
          {/* verde aqui, para não se confundir com o botão azul da videochamada */}
          <span className="vol-quando vol-quando-verde">{quando(atendimento.inicio)}</span>
          <BotaoVideochamada atendimento={atendimento} className="botao botao-primario vol-botao-video" aoAtualizar={aoAtualizar} />
        </div>
      </div>
      <blockquote className="vol-caso">
        <p>{atendimento.descricao}</p>
      </blockquote>
      {/* a chave zera o painel quando este sai e o próximo da fila entra no lugar */}
      <AcoesAtendimento key={atendimento.id} id={atendimento.id} marcarRealizado={marcarRealizado} cancelar={cancelar} />
    </section>
  );
}

// com aoAbrir, cada linha vira um botão que abre o atendimento
export function ListaAtendimentos({ itens, vazio, mostrarStatus = false, aoAbrir }) {
  if (!itens.length) return <p className="vol-vazio">{vazio}</p>;

  return (
    <ul className="vol-lista">
      {itens.map((a) => {
        const linha = (
          <>
            <time dateTime={a.horario.data} className="vol-lista-data">
              <strong>{a.inicio.getDate()}</strong>
              <span>{a.inicio.toLocaleDateString(localeAtual(), { month: "short" }).replace(".", "")}</span>
            </time>
            <span className="vol-lista-texto">
              <strong>{a.usuario.nome}</strong>
              <span>
                {a.servico.titulo} · {a.horario.hora_inicio}
              </span>
            </span>
            {mostrarStatus && <Status status={a.status} />}
          </>
        );
        return (
          <li key={a.id}>
            {aoAbrir ? (
              <button type="button" className="vol-lista-linha vol-lista-botao" onClick={() => aoAbrir(a.id)}>
                {linha}
              </button>
            ) : (
              <div className="vol-lista-linha">{linha}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Pendencias({ pendencias }) {
  const t = useTextos(traducoes);
  const feitas = pendencias.filter((p) => p.feito).length;

  return (
    <section className="vol-pendencias" aria-labelledby="vol-pendencias-titulo">
      <div>
        <h2 id="vol-pendencias-titulo">{t.pendenciasTitulo}</h2>
        <p>{t.pendenciasProntos(feitas, pendencias.length)}</p>
      </div>
      <ul>
        {pendencias.map((p) => (
          <li key={p.chave} className={p.feito ? "vol-pendencia-feita" : ""}>
            <Svg nome={p.feito ? "check" : "relogio"} tamanho={18} />
            <span>{t.pendencias[p.chave]}</span>
            {p.feito ? (
              <small>{t.pronto}</small>
            ) : (
              <Link to={ONDE_RESOLVER[p.chave]}>{t.resolver[p.chave]}</Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HorariosLivres({ horarios, limite = 6 }) {
  const t = useTextos(traducoes);
  if (!horarios.length) return <p className="vol-vazio">{t.semHorariosLivres}</p>;

  return (
    <ul className="vol-horarios">
      {horarios.slice(0, limite).map((h) => {
        const dia = new Date(`${h.data}T${h.hora_inicio}:00`);
        return (
          <li key={h.id}>
            <time dateTime={`${h.data}T${h.hora_inicio}`}>{diaCurto(dia)}</time>
            <span>{t.intervalo(h.hora_inicio, h.hora_fim)}</span>
          </li>
        );
      })}
    </ul>
  );
}

// liga e desliga, com a palavra ao lado (não depende só da cor)
export function Interruptor({ ligado, aoMudar, rotulo, desabilitado = false }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} className="vol-interruptor" onClick={aoMudar} disabled={desabilitado}>
      <span className="vol-interruptor-trilho" aria-hidden="true">
        <span></span>
      </span>
      {rotulo}
    </button>
  );
}

// janela por cima da página; o <dialog> já fecha com Esc e prende o foco dentro
export function Janela({ aberta, titulo, aoFechar, children }) {
  const t = useTextos(traducoes);
  const janela = useRef(null);

  useEffect(() => {
    const dialogo = janela.current;
    if (aberta && !dialogo.open) dialogo.showModal();
    if (!aberta && dialogo.open) dialogo.close();
  }, [aberta]);

  return (
    <dialog
      ref={janela}
      className="vol-janela"
      aria-labelledby="vol-janela-titulo"
      onClose={aoFechar}
      onClick={(e) => e.target === janela.current && aoFechar()}
    >
      {aberta && (
        <div className="vol-janela-conteudo">
          <div className="vol-janela-topo">
            <h2 id="vol-janela-titulo">{titulo}</h2>
            <button type="button" className="pagina-icone" onClick={aoFechar} aria-label={t.fechar}>
              <Svg nome="x" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
