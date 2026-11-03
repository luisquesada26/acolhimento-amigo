import { useEffect, useMemo, useRef, useState } from "react";
import { localeAtual, useTextos } from "../../context/IdiomaContext";
import { Svg } from "../voluntario/comum";
import { diasDoCalendario, lerDataLocal } from "./useBusca";
import { traducoes } from "./traducoes";

// setas andam um dia para o lado ou uma semana para cima e para baixo
const PASSOS = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

// "Novembro" ou, quando os 14 dias viram o mês, "Novembro e dezembro"
function mesesDaJanela(dias, locale) {
  const formato = new Intl.DateTimeFormat(locale, { month: "long" });
  const meses = [...new Set(dias.filter((d) => d.livre).map((d) => formato.format(d.data)))];
  const texto = new Intl.ListFormat(locale, { type: "conjunction" }).format(meses);
  return texto[0].toUpperCase() + texto.slice(1);
}

function Calendario({ escolhido, aoEscolher }) {
  const t = useTextos(traducoes).busca;
  const locale = localeAtual();
  const dias = useMemo(() => diasDoCalendario(), []);
  const [foco, setFoco] = useState(() => (dias.some((d) => d.livre && d.valor === escolhido) ? escolhido : dias.find((d) => d.hoje).valor));
  const caixa = useRef(null);

  // abre com o foco no dia escolhido (ou em hoje) e, no celular, rola até o calendário aparecer inteiro
  useEffect(() => {
    caixa.current.scrollIntoView({ block: "nearest" });
    caixa.current.querySelector('[tabindex="0"]').focus({ preventScroll: true });
  }, []);

  function andar(e) {
    const passo = PASSOS[e.key];
    if (!passo) return;
    e.preventDefault();
    const destino = dias[dias.findIndex((d) => d.valor === foco) + passo];
    if (!destino?.livre) return;
    setFoco(destino.valor);
    caixa.current.querySelector(`[data-dia="${destino.valor}"]`).focus();
  }

  const semana = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const extenso = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" });

  // tabIndex -1: o clique num dia apagado ou no espaço entre os dias deixa o foco aqui dentro
  return (
    <div id="bus-calendario" className="bus-calendario" role="dialog" aria-label={t.escolherDia} tabIndex={-1} ref={caixa} onKeyDown={andar}>
      <strong className="bus-cal-mes">{mesesDaJanela(dias, locale)}</strong>
      <div className="bus-cal-semana" aria-hidden="true">
        {dias.slice(0, 7).map((d) => (
          <span key={d.valor}>{semana.format(d.data).replace(".", "")}</span>
        ))}
      </div>
      <div className="bus-cal-dias">
        {dias.map((d) => (
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
        ))}
      </div>
    </div>
  );
}

// o "Quando" da busca: dois atalhos e o botão que abre o calendário dos próximos 14 dias
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
