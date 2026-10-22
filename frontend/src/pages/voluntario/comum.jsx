import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { nomeDoIdioma } from "./usePainel";
import Avatar from "../../components/Avatar";
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
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

export function diaExtenso(data) {
  return data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

export function diaCurto(data) {
  return data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "");
}

// "Qua, 28/10/2026"
export function dataComAno(data) {
  const texto = data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).replace(".", "");
  return texto[0].toUpperCase() + texto.slice(1);
}

// cabeçalho "Data" que alterna entre mais recentes e mais antigos primeiro
export function OrdenarPorData({ ordem, aoMudar }) {
  return (
    <button
      type="button"
      className="vol-ordenar"
      onClick={() => aoMudar(ordem === "desc" ? "asc" : "desc")}
      title={ordem === "desc" ? "Mais recentes primeiro" : "Mais antigos primeiro"}
    >
      Data <Svg nome={ordem === "desc" ? "setaBaixo" : "setaCima"} tamanho={14} />
    </button>
  );
}

export function formatarHoras(minutos) {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h === 0) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

// "Hoje", "Amanhã", "Em 3 dias"
export function quando(data) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dia = new Date(data);
  dia.setHours(0, 0, 0, 0);
  const dias = Math.round((dia - hoje) / 86400000);

  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  if (dias === -1) return "Ontem";
  if (dias > 1 && dias < 14) return `Em ${dias} dias`;
  if (dias >= 14) return `Em ${Math.round(dias / 7)} semanas`;
  return `Há ${-dias} dias`;
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
  relatorio: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8 M8 9h2",
  busca: "M11 3a8 8 0 1 0 0 16a8 8 0 1 0 0-16z M21 21l-4.3-4.3",
};

export function Svg({ nome, tamanho }) {
  return <Icone d={icones[nome]} tamanho={tamanho} />;
}

export const NAVEGACAO = [
  { nome: "Painel", icone: "painel", caminho: "/voluntario", grupo: "Seu trabalho" },
  { nome: "Agenda", icone: "agenda", caminho: "/voluntario/agenda", grupo: "Seu trabalho" },
  { nome: "Atendimentos", icone: "atendimentos", caminho: "/voluntario/atendimentos", grupo: "Seu trabalho" },
  { nome: "Relatórios", icone: "relatorio", caminho: "/voluntario/relatorios", grupo: "Seu trabalho" },
  { nome: "Meu perfil", icone: "perfil", caminho: "/voluntario/perfil", grupo: "Sua conta" },
];

// onde resolver cada pendência do perfil
const ONDE_RESOLVER = {
  perfil: { caminho: "/voluntario/perfil", texto: "Completar perfil" },
  servico: { caminho: "/voluntario/perfil?aba=servicos", texto: "Criar serviço" },
  horario: { caminho: "/voluntario/perfil?aba=agenda", texto: "Abrir horários" },
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

// concluir marca como realizado: sai dos próximos e vai para o histórico, com a anotação do voluntário
export function ConcluirAtendimento({ id, marcarRealizado, rotulo = "Concluir atendimento" }) {
  const [confirmando, setConfirmando] = useState(false);
  const [anotacao, setAnotacao] = useState("");
  const campo = useId();
  const { executar, ocupado, erro } = useAcao(() => marcarRealizado(id, anotacao));

  if (!confirmando) {
    return (
      <button type="button" className="vol-botao-secundario vol-botao-concluir" onClick={() => setConfirmando(true)}>
        <Svg nome="check" tamanho={18} /> {rotulo}
      </button>
    );
  }

  return (
    <div className="vol-confirmar vol-confirmar-concluir">
      <label htmlFor={campo}>Anotação do atendimento (opcional)</label>
      <textarea
        id={campo}
        rows={3}
        maxLength={1000}
        value={anotacao}
        onChange={(e) => setAnotacao(e.target.value)}
        placeholder="O que foi feito, o que você recomendou e qual o próximo passo."
      />
      <div className="vol-acoes">
        <button type="button" className="botao botao-primario botao-voluntario vol-botao-pequeno" onClick={executar} disabled={ocupado}>
          {ocupado ? "Concluindo..." : "Concluir atendimento"}
        </button>
        <button type="button" className="vol-botao-secundario" onClick={() => setConfirmando(false)} disabled={ocupado}>
          Voltar
        </button>
      </div>
      {erro && <p className="vol-erro" role="alert">{erro}</p>}
    </div>
  );
}

export function CancelarAtendimento({ id, cancelar, rotulo = "Cancelar atendimento" }) {
  const [confirmando, setConfirmando] = useState(false);
  const { executar, ocupado, erro } = useAcao(() => cancelar(id));

  if (!confirmando) {
    return (
      <button type="button" className="vol-botao-perigo" onClick={() => setConfirmando(true)}>
        {rotulo}
      </button>
    );
  }

  return (
    <div className="vol-confirmar">
      <span>Cancelar mesmo? A pessoa recebe o horário de volta para escolher outro.</span>
      <div className="vol-acoes">
        <button type="button" className="vol-botao-perigo vol-botao-cheio" onClick={executar} disabled={ocupado}>
          {ocupado ? "Cancelando..." : "Sim, cancelar"}
        </button>
        <button type="button" className="vol-botao-secundario" onClick={() => setConfirmando(false)} disabled={ocupado}>
          Não
        </button>
      </div>
      {erro && <p className="vol-erro" role="alert">{erro}</p>}
    </div>
  );
}

export function Status({ status }) {
  if (status === "realizado") {
    return (
      <span className="vol-status vol-status-realizado">
        <Svg nome="check" tamanho={14} /> Realizado
      </span>
    );
  }
  if (status === "cancelado") {
    return (
      <span className="vol-status vol-status-cancelado">
        <Svg nome="x" tamanho={14} /> Cancelado
      </span>
    );
  }
  return (
    <span className="vol-status vol-status-confirmado">
      <Svg nome="relogio" tamanho={14} /> Confirmado
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
  return (
    <div className="vol-pessoa">
      <span className="vol-pessoa-nome">
        <Avatar nome={usuario.nome} foto={usuario.foto} className="vol-pessoa-avatar" />
        <strong>{usuario.nome}</strong>
      </span>
      <ul className="vol-contato">
        <li>
          <Svg nome="globo" tamanho={15} /> {usuario.pais_origem || "Nacionalidade não informada"}
        </li>
        <li>
          <Svg nome="idioma" tamanho={15} /> Fala {nomeDoIdioma(usuario.idioma).toLowerCase()}
        </li>
        <li>
          <Svg nome="telefone" tamanho={15} />{" "}
          {usuario.telefone ? <a href={`tel:${usuario.telefone}`}>{formatarTelefone(usuario.telefone)}</a> : "Telefone não informado"}
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

const NUMEROS = [
  { chave: "realizados", rotulo: "Atendimentos realizados", icone: "check" },
  { chave: "pessoas", rotulo: "Pessoas atendidas", icone: "pessoas" },
  { chave: "minutos", rotulo: "Horas de atendimento", icone: "relogio", formato: formatarHoras },
  { chave: "marcados", rotulo: "Atendimentos marcados", icone: "agenda" },
  { chave: "livres", rotulo: "Horários livres", icone: "mais" },
];

export function Numeros({ numeros }) {
  return (
    <ul className="vol-numeros vol-numeros-cartoes">
      {NUMEROS.map((n) => (
        <li key={n.chave}>
          <span className="vol-numero-icone">
            <Svg nome={n.icone} />
          </span>
          <strong>{n.formato ? n.formato(numeros[n.chave]) : numeros[n.chave]}</strong>
          <span>{n.rotulo}</span>
        </li>
      ))}
    </ul>
  );
}

export function Aguardando({ itens, marcarRealizado, cancelar }) {
  if (!itens.length) return null;

  return (
    <section className="vol-aguardando" aria-labelledby="vol-aguardando-titulo">
      <h2 id="vol-aguardando-titulo">
        <Svg nome="alerta" /> Precisa da sua confirmação
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

  return (
    <li>
      <p>
        O atendimento de <time dateTime={atendimento.horario.data}>{diaExtenso(atendimento.inicio)}</time>, às {atendimento.horario.hora_inicio}, com{" "}
        <strong>{atendimento.usuario.nome}</strong> já terminou. Ele aconteceu?
      </p>
      <div className="vol-acoes">
        <ConcluirAtendimento id={atendimento.id} marcarRealizado={marcarRealizado} rotulo="Marcar como realizado" />
        <CancelarAtendimento id={atendimento.id} cancelar={cancelar} rotulo="Não aconteceu" />
      </div>
    </li>
  );
}

export function ProximoAtendimento({ atendimento, cancelar, marcarRealizado, titulo = "Próximo atendimento" }) {
  if (!atendimento) {
    return (
      <section className="vol-proximo vol-proximo-vazio" aria-labelledby="vol-proximo-titulo">
        <h2 id="vol-proximo-titulo">{titulo}</h2>
        <p>Nenhum atendimento marcado por enquanto. Quando alguém escolher um horário seu, ele aparece aqui.</p>
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
              {diaExtenso(atendimento.inicio)}, das {atendimento.horario.hora_inicio} às {atendimento.horario.hora_fim}
            </time>
          </p>
          <Pessoa usuario={atendimento.usuario} />
          <p className="vol-servico">{atendimento.servico.titulo}</p>
        </div>
        <div className="vol-proximo-lado">
          {/* verde aqui, para não se confundir com o botão azul da videochamada */}
          <span className="vol-quando vol-quando-verde">{quando(atendimento.inicio)}</span>
          {/* a videochamada não faz parte do projeto: o botão fica só para mostrar onde ela entraria */}
          <button type="button" className="botao botao-primario vol-botao-video">
            <Svg nome="video" tamanho={16} /> Entrar na videochamada
          </button>
        </div>
      </div>
      <blockquote className="vol-caso">
        <p>{atendimento.descricao}</p>
      </blockquote>
      <div className="vol-acoes vol-proximo-acoes">
        <ConcluirAtendimento id={atendimento.id} marcarRealizado={marcarRealizado} />
        <CancelarAtendimento id={atendimento.id} cancelar={cancelar} />
      </div>
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
              <span>{a.inicio.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
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
  const feitas = pendencias.filter((p) => p.feito).length;

  return (
    <section className="vol-pendencias" aria-labelledby="vol-pendencias-titulo">
      <div>
        <h2 id="vol-pendencias-titulo">Complete seu perfil para aparecer na busca</h2>
        <p>
          {feitas} de {pendencias.length} prontos. Quem procura atendimento só encontra você quando tudo estiver pronto.
        </p>
      </div>
      <ul>
        {pendencias.map((p) => (
          <li key={p.chave} className={p.feito ? "vol-pendencia-feita" : ""}>
            <Svg nome={p.feito ? "check" : "relogio"} tamanho={18} />
            <span>{p.titulo}</span>
            {p.feito ? (
              <small>Pronto</small>
            ) : (
              <Link to={ONDE_RESOLVER[p.chave].caminho}>{ONDE_RESOLVER[p.chave].texto}</Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HorariosLivres({ horarios, limite = 6 }) {
  if (!horarios.length) return <p className="vol-vazio">Você ainda não abriu horários na agenda.</p>;

  return (
    <ul className="vol-horarios">
      {horarios.slice(0, limite).map((h) => {
        const dia = new Date(`${h.data}T${h.hora_inicio}:00`);
        return (
          <li key={h.id}>
            <time dateTime={`${h.data}T${h.hora_inicio}`}>{diaCurto(dia)}</time>
            <span>
              {h.hora_inicio} às {h.hora_fim}
            </span>
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
            <button type="button" className="pagina-icone" onClick={aoFechar} aria-label="Fechar">
              <Svg nome="x" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
