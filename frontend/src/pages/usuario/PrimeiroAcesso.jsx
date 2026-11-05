import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTextos } from "../../context/IdiomaContext";
import { Svg, dataComAno } from "../voluntario/comum";
import { momento } from "./comum";
import { traducoes } from "./traducoes";
import { useAbertura, useAtendimentos } from "./useAtendimentos";
import "./passos.css";

// enquanto o Luis escolhe: A é a faixa no topo, B é o cartão de passos
const CHAVE_OPCAO = "acolhimento:opcao-passos";
const OPCOES = ["a", "b"];
const COMPLETAR = "/usuario/completar";
const FIM = 4;

function lerOpcao() {
  try {
    const salva = localStorage.getItem(CHAVE_OPCAO);
    return OPCOES.includes(salva) ? salva : "a";
  } catch {
    return "a";
  }
}

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
  const [opcao, setOpcao] = useState(lerOpcao);
  const [primeiro, setPrimeiro] = useState(null);

  // o aviso de fim fica só na tela em que marcou; saiu dela, o progresso não volta
  if (primeiro && primeiro.caminho !== pathname) setPrimeiro(null);

  const novo = lista ? lista.length === 0 : Boolean(state?.primeiroAcesso);
  const passoAtual = primeiro ? FIM : passoDaRota(pathname);
  const mostrar = Boolean(primeiro) || (novo && passoAtual > 0);

  const valor = useMemo(
    () => ({
      opcao,
      mostrar,
      fim: passoAtual === FIM,
      passo: passoAtual,
      horario: primeiro?.horario ?? null,
      trocarOpcao(nova) {
        setOpcao(nova);
        try {
          localStorage.setItem(CHAVE_OPCAO, nova);
        } catch {
          // sem localStorage a troca vale só até recarregar
        }
      },
      marcouPrimeiro(horario) {
        setPrimeiro({ horario, caminho: pathname });
      },
    }),
    [opcao, mostrar, passoAtual, primeiro, pathname],
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

// quem marcou o horário lá embaixo precisa ver o fim
function useRolarNoFim(fim, bloco) {
  const ref = useRef(null);
  useEffect(() => {
    if (fim) ref.current?.scrollIntoView({ behavior: "smooth", block: bloco });
  }, [fim, bloco]);
  return ref;
}

// opção A: faixa no topo da busca e do perfil do voluntário
function FaixaPassos() {
  const { passo, fim, horario } = usePassos();
  const t = useTextos(traducoes).progresso;
  const ref = useRolarNoFim(fim, "center");

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

// opção B: a lateral da tela de boas-vindas, compacta, acompanhando a pessoa
function CartaoPassos() {
  const { passo, fim, horario } = usePassos();
  const tudo = useTextos(traducoes);
  const t = tudo.progresso;
  const ref = useRolarNoFim(fim, "nearest");

  return (
    <aside ref={ref} className={fim ? "pas-cartao pas-cartao-fim" : "pas-cartao"} aria-label={t.titulo}>
      <span className="pas-selo">{t.titulo}</span>
      {fim ? null : (
        <p className="pas-agora">
          <small>{t.passoDe(passo)}</small>
          <strong>{tudo.primeiro.passos[passo - 1].titulo}</strong>
        </p>
      )}
      <Etapas passo={passo} />
      {fim ? <Fim horario={horario} /> : <p className="pas-dica">{t.dicas[passo]}</p>}
    </aside>
  );
}

// o conteúdo da área do usuário com o progresso da opção escolhida em volta.
// A estrutura não muda quando o progresso some, para a tela de dentro não recarregar
export function AreaComPassos({ topo, children }) {
  const { mostrar, opcao } = usePassos();
  return (
    <div className="pas-area">
      <main className="usu-conteudo">
        {topo}
        {mostrar && opcao === "a" ? <FaixaPassos /> : null}
        {children}
      </main>
      {mostrar && opcao === "b" ? <CartaoPassos /> : null}
    </div>
  );
}

// barra provisória para comparar as duas opções no mesmo estado
export function TrocaOpcao() {
  const { opcao, trocarOpcao, mostrar } = usePassos();
  const { pathname } = useLocation();
  const t = useTextos(traducoes).progresso.opcoes;
  if (!mostrar && pathname !== COMPLETAR) return null;

  return (
    <div className="pas-troca" role="group" aria-label={t.rotulo}>
      <span>{t.rotulo}</span>
      {OPCOES.map((o) => (
        <button key={o} type="button" className={opcao === o ? "pas-troca-ligada" : ""} aria-pressed={opcao === o} onClick={() => trocarOpcao(o)}>
          {t[o]}
        </button>
      ))}
    </div>
  );
}
