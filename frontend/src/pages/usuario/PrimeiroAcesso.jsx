import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTextos } from "../../context/IdiomaContext";
import { Svg, dataComAno } from "../voluntario/comum";
import { momento } from "./comum";
import { traducoes } from "./traducoes";
import { useAbertura, useAtendimentos } from "./useAtendimentos";
import "./passos.css";

const FIM = 4;

// na busca a pessoa está no passo 2; no perfil de um voluntário, no 3
function passoDaRota(pathname) {
  if (pathname === "/usuario") return 2;
  if (pathname.startsWith("/usuario/voluntario/")) return 3;
  return 0;
}

const Contexto = createContext(null);

// o primeiro acesso acaba no primeiro agendamento: quem já tem algum (até cancelado) não vê o progresso.
// Antes da lista chegar, só quem acabou de salvar o passo 1 vê, para a faixa não aparecer atrasada
export function PassosProvider({ children }) {
  const { lista } = useAtendimentos();
  const { pathname, state } = useLocation();
  const [primeiro, setPrimeiro] = useState(null);

  // o aviso de fim fica só na tela em que marcou; saiu dela, o progresso não volta
  if (primeiro && primeiro.caminho !== pathname) setPrimeiro(null);

  const novo = lista ? lista.length === 0 : Boolean(state?.primeiroAcesso);
  const passoAtual = primeiro ? FIM : passoDaRota(pathname);
  const mostrar = Boolean(primeiro) || (novo && passoAtual > 0);

  const valor = useMemo(
    () => ({
      mostrar,
      fim: passoAtual === FIM,
      passo: passoAtual,
      horario: primeiro?.horario ?? null,
      marcouPrimeiro(horario) {
        setPrimeiro({ horario, caminho: pathname });
      },
    }),
    [mostrar, passoAtual, primeiro, pathname],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePassos() {
  return useContext(Contexto);
}

function Etapas({ passo }) {
  const tudo = useTextos(traducoes);
  return (
    <ol className="pas-etapas">
      {tudo.primeiro.passos.map((p, i) => {
        const numero = i + 1;
        const estado = numero < passo ? "feito" : numero === passo ? "atual" : "depois";
        return (
          <li key={p.titulo} className={`pas-etapa pas-${estado}`} aria-current={estado === "atual" ? "step" : undefined}>
            <span className="pas-bola">{estado === "feito" ? <Svg nome="check" tamanho={15} /> : numero}</span>
            <span className="pas-etapa-texto">
              <strong>
                {p.titulo}
                {estado === "feito" ? <span className="pas-sr"> ({tudo.progresso.feito})</span> : null}
              </strong>
              <small>{p.texto}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Fim({ horario }) {
  const t = useTextos(traducoes).progresso;
  const { abrir } = useAbertura();
  return (
    <div className="pas-fim" role="status">
      <span className="pas-fim-icone">
        <Svg nome="check" tamanho={20} />
      </span>
      <span className="pas-fim-texto">
        <strong>{t.fimTitulo}</strong>
        <small>{t.fimTexto(dataComAno(momento(horario)), horario.hora_inicio)}</small>
      </span>
      <button type="button" className="pas-fim-botao" onClick={abrir}>
        {t.ver}
      </button>
    </div>
  );
}

// faixa no topo da busca e do perfil do voluntário. Quando some, devolve null no mesmo lugar,
// para a tela de baixo não montar de novo
export function FaixaPassos() {
  const { mostrar, passo, fim, horario } = usePassos();
  const t = useTextos(traducoes).progresso;
  const ref = useRef(null);

  // quem marcou o horário lá embaixo precisa ver o fim
  useEffect(() => {
    if (fim) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [fim]);

  if (!mostrar) return null;

  return (
    <section ref={ref} className={fim ? "pas-faixa pas-faixa-fim" : "pas-faixa"} aria-label={t.titulo}>
      <p className="pas-faixa-topo">
        <span className="pas-selo">{t.titulo}</span>
        <span className="pas-contagem">{fim ? t.pronto : t.passoDe(passo)}</span>
      </p>
      <Etapas passo={passo} />
      {fim ? <Fim horario={horario} /> : null}
    </section>
  );
}
