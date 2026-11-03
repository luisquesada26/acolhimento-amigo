import { useEffect, useRef, useState } from "react";
import { localeAtual, useTextos } from "../../context/IdiomaContext";
import { Svg } from "../voluntario/comum";
import { dataLocal, diasDoMes, lerDataLocal, somarDias, somarMeses } from "./useBusca";
import { traducoes } from "./traducoes";

// setas andam um dia para o lado ou uma semana para cima e para baixo; PageUp e PageDown trocam de mês
const PASSOS = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
const MESES = { PageUp: -1, PageDown: 1 };

// os nomes do cabeçalho saem de uma semana qualquer que começa na segunda (2/11/2026)
const SEMANA = Array.from({ length: 7 }, (_, i) => new Date(2026, 10, 2 + i));

const maiuscula = (texto) => texto[0].toUpperCase() + texto.slice(1);

function Calendario({ escolhido, aoEscolher }) {
  const t = useTextos(traducoes).busca;
  const locale = localeAtual();
  const hoje = dataLocal(new Date());
  // o mês visível é sempre o do dia em foco. Abre no dia escolhido ou, sem dia (ou com um que já passou ou não existe), em hoje
  const [foco, setFoco] = useState(() => (escolhido >= hoje && somarDias(escolhido, 0) === escolhido ? escolhido : hoje));
  const mes = foco.slice(0, 7);
  const podeVoltar = mes > hoje.slice(0, 7);
  const caixa = useRef(null);
  // pelo teclado o foco vai junto para o dia novo, que pode ser de outro mês e só existe depois de desenhar
  const levarFoco = useRef(false);

  // abre com o foco no dia escolhido (ou em hoje) e, no celular, rola até o calendário aparecer inteiro
  useEffect(() => {
    caixa.current.scrollIntoView({ block: "nearest" });
    caixa.current.querySelector('[tabindex="0"]').focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!levarFoco.current) return;
    levarFoco.current = false;
    caixa.current.querySelector(`[data-dia="${foco}"]`).focus();
  }, [foco]);

  // o mesmo dia no mês ao lado; voltando para o mês atual, nunca antes de hoje
  function noMes(passo) {
    const destino = somarMeses(foco, passo);
    return destino < hoje ? hoje : destino;
  }

  // pelos botões o foco fica no botão clicado
  function trocarMes(passo) {
    if (passo < 0 && !podeVoltar) return;
    setFoco(noMes(passo));
  }

  function andar(e) {
    const passo = PASSOS[e.key];
    const meses = MESES[e.key];
    if (!passo && !meses) return;
    e.preventDefault();
    if (meses < 0 && !podeVoltar) return;
    const destino = passo ? somarDias(foco, passo) : noMes(meses);
    // dia que já passou não recebe o foco: a seta fica parada
    if (destino < hoje) return;
    levarFoco.current = true;
    setFoco(destino);
  }

  const semana = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const extenso = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" });
  const titulo = maiuscula(new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(lerDataLocal(foco)));

  // tabIndex -1: o clique num dia apagado ou no espaço entre os dias deixa o foco aqui dentro.
  // "Mês anterior" usa aria-disabled e não disabled: ao voltar para o mês atual, o foco continua no botão
  return (
    <div id="bus-calendario" className="bus-calendario" role="dialog" aria-label={t.escolherDia} tabIndex={-1} ref={caixa} onKeyDown={andar}>
      <div className="bus-cal-topo">
        <button type="button" className="bus-cal-seta" aria-label={t.mesAnterior} aria-disabled={!podeVoltar} onClick={() => trocarMes(-1)}>
          <Svg nome="anterior" tamanho={18} />
        </button>
        <strong className="bus-cal-mes" aria-live="polite">
          {titulo}
        </strong>
        <button type="button" className="bus-cal-seta" aria-label={t.proximoMes} onClick={() => trocarMes(1)}>
          <Svg nome="proximo" tamanho={18} />
        </button>
      </div>
      <div className="bus-cal-semana" aria-hidden="true">
        {SEMANA.map((d) => (
          <span key={d.getDay()}>{semana.format(d).replace(".", "")}</span>
        ))}
      </div>
      <div className="bus-cal-dias">
        {diasDoMes(mes).map((d, i) =>
          d ? (
            <button
              key={d.valor}
              type="button"
              data-dia={d.valor}
              disabled={!d.livre}
              tabIndex={d.valor === foco ? 0 : -1}
              aria-label={extenso.format(d.data)}
              aria-pressed={d.valor === escolhido}
              aria-current={d.hoje ? "date" : undefined}
              onClick={() => aoEscolher(d.valor)}
            >
              {d.data.getDate()}
            </button>
          ) : (
            <span key={`vazio-${i}`} aria-hidden="true" />
          ),
        )}
      </div>
    </div>
  );
}

// o "Quando" da busca: dois atalhos e o botão que abre o calendário do mês
export default function FiltroQuando({ valor, aoMudar }) {
  const t = useTextos(traducoes).busca;
  const [aberto, setAberto] = useState(false);
  const caixa = useRef(null);
  const botao = useRef(null);
  // só um AAAA-MM-DD é dia; qualquer outro valor não pode derrubar o Intl lá embaixo
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : "";

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => !caixa.current.contains(e.target) && setAberto(false);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  function escolher(novo) {
    aoMudar(novo);
    setAberto(false);
  }

  function escolherDia(novo) {
    escolher(novo);
    botao.current.focus();
  }

  function tecla(e) {
    if (e.key !== "Escape" || !aberto) return;
    setAberto(false);
    botao.current.focus();
  }

  // saindo com Tab o calendário fecha; o clique fora já é do mousedown
  function saiu(e) {
    if (aberto && e.relatedTarget && !caixa.current.contains(e.relatedTarget)) setAberto(false);
  }

  return (
    <div className="bus-filtro bus-filtro-quando" ref={caixa} onKeyDown={tecla} onBlur={saiu}>
      <span id="bus-rotulo-quando" className="bus-filtro-rotulo">
        {t.quando}
      </span>
      <div className="bus-segmento" role="group" aria-labelledby="bus-rotulo-quando">
        <button type="button" className={valor ? "" : "bus-ligada"} aria-pressed={!valor} onClick={() => escolher("")}>
          {t.qualquerDia}
        </button>
        <button type="button" className={valor === "semana" ? "bus-ligada" : ""} aria-pressed={valor === "semana"} onClick={() => escolher(valor === "semana" ? "" : "semana")}>
          {t.proximos7}
        </button>
        <button
          ref={botao}
          type="button"
          className={dia ? "bus-ligada" : ""}
          aria-pressed={Boolean(dia)}
          aria-haspopup="dialog"
          aria-expanded={aberto}
          aria-controls={aberto ? "bus-calendario" : undefined}
          onClick={() => setAberto(!aberto)}
        >
          <Svg nome="agenda" tamanho={15} />
          {dia ? new Intl.DateTimeFormat(localeAtual(), { weekday: "short", day: "2-digit", month: "2-digit" }).format(lerDataLocal(dia)) : t.escolherDia}
        </button>
      </div>
      {aberto && <Calendario escolhido={dia} aoEscolher={escolherDia} />}
    </div>
  );
}
