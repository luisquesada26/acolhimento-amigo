import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { lerErro } from "../../services/api";
import BotaoVideochamada from "../../components/BotaoVideochamada";
import { localeAtual, useTextos } from "../../context/IdiomaContext";
import { Svg, quando } from "../voluntario/comum";
import { momento } from "./comum";
import { situacao, useAbertura, useAtendimentos } from "./useAtendimentos";
import { traducoes } from "./traducoes";
import "./atendimentos.css";

const ABAS = ["proximos", "anteriores", "cancelados"];

function Data({ inicio }) {
  return (
    <span className="ma-data" aria-hidden="true">
      <small>{inicio.toLocaleDateString(localeAtual(), { weekday: "short" }).replace(".", "")}</small>
      <strong>{inicio.getDate()}</strong>
      <small>{inicio.toLocaleDateString(localeAtual(), { month: "short" }).replace(".", "")}</small>
    </span>
  );
}

// a confirmação fica dentro do item; Esc aqui só desiste de cancelar, não fecha o painel
function ConfirmarCancelamento({ atendimento, aoCancelar, aoManter }) {
  const t = useTextos(traducoes).atendimentos;
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const manter = useRef(null);

  useEffect(() => manter.current?.focus(), []);

  async function cancelar() {
    setEnviando(true);
    setErro("");
    try {
      const { data } = await api.delete(`/agendamentos/${atendimento.id}`);
      aoCancelar(data);
    } catch (problema) {
      setErro(lerErro(problema).mensagem);
      setEnviando(false);
    }
  }

  function tecla(e) {
    if (e.key !== "Escape" || enviando) return;
    e.stopPropagation();
    aoManter();
  }

  return (
    <div className="ma-confirmar" role="alertdialog" aria-labelledby={`ma-confirmar-${atendimento.id}`} onKeyDown={tecla}>
      <p id={`ma-confirmar-${atendimento.id}`}>{t.cancelarConfirmar}</p>
      {erro && <span className="campo-erro">{erro}</span>}
      <div className="ma-confirmar-acoes">
        <button ref={manter} type="button" className="ma-botao" onClick={aoManter} disabled={enviando}>
          {t.manter}
        </button>
        <button type="button" className="ma-botao-perigo ma-botao-perigo-cheio" onClick={cancelar} disabled={enviando}>
          {enviando ? t.cancelando : t.simCancelar}
        </button>
      </div>
    </div>
  );
}

// uma linha: data, hora, serviço e voluntário; nos próximos, a videochamada e o cancelar
function ItemCompacto({ atendimento: a, agora, aoCancelar, aoAtualizar }) {
  const t = useTextos(traducoes).atendimentos;
  const [confirmando, setConfirmando] = useState(false);
  const botaoCancelar = useRef(null);
  const inicio = momento(a.horario);
  const estado = situacao(a, agora);

  function manter() {
    setConfirmando(false);
    setTimeout(() => botaoCancelar.current?.focus(), 0);
  }

  return (
    <li className="ma-compacto">
      <Link to={`/usuario/voluntario/${a.voluntario.id}`} className="ma-compacto-link">
        <Data inicio={inicio} />
        <span className="ma-compacto-corpo">
          <small>
            {t.horario(a.horario.hora_inicio, a.horario.hora_fim)}
            {estado === "confirmado" && ` · ${quando(inicio)}`}
          </small>
          <strong>{a.servico.titulo}</strong>
          <span>{a.voluntario.nome}</span>
        </span>
      </Link>
      <span className="ma-compacto-lado">
        <span className={`ma-status ma-status-${estado}`}>{t.status[estado]}</span>
        {estado === "confirmado" && !confirmando && (
          <button ref={botaoCancelar} type="button" className="ma-compacto-cancelar" onClick={() => setConfirmando(true)} aria-label={t.cancelar}>
            {t.cancelarCurto}
          </button>
        )}
      </span>
      {estado === "confirmado" && (
        <span className="ma-compacto-video">
          <BotaoVideochamada atendimento={a} className="ma-botao-video" aoAtualizar={aoAtualizar} />
        </span>
      )}
      {confirmando && <ConfirmarCancelamento atendimento={a} aoCancelar={aoCancelar} aoManter={manter} />}
    </li>
  );
}

function Abas({ aba, aoEscolher }) {
  const t = useTextos(traducoes).atendimentos;
  const { grupos } = useAtendimentos();

  return (
    <div className="ma-abas ma-abas-pequenas" role="tablist" aria-label={t.abas}>
      {ABAS.map((chave) => (
        <button
          key={chave}
          type="button"
          role="tab"
          id={`ma-pop-aba-${chave}`}
          aria-selected={aba === chave}
          aria-controls="ma-pop-painel"
          className={aba === chave ? "ma-aba ma-aba-ligada" : "ma-aba"}
          onClick={() => aoEscolher(chave)}
        >
          {t[chave]}
          <span className="ma-contagem">{grupos[chave].length}</span>
        </button>
      ))}
    </div>
  );
}

// carregando ou com erro: devolve o aviso; pronto: devolve null
function useEstadoLista() {
  const t = useTextos(traducoes).atendimentos;
  const { lista, erro, carregar } = useAtendimentos();

  if (erro) {
    return (
      <div className="usu-estado">
        <p className="aviso" role="alert">
          {erro}
        </p>
        <button type="button" className="botao botao-primario" onClick={carregar}>
          {t.tentarDeNovo}
        </button>
      </div>
    );
  }
  if (!lista) {
    return (
      <p className="usu-estado" role="status">
        {t.carregando}
      </p>
    );
  }
  return null;
}

// fecha com Esc e com clique fora. O caminho do evento é o do momento do clique:
// o botão "Cancelar" some no mesmo clique, e mesmo assim o clique foi dentro
function useFecharFora(ancora, aoFecharTeclado, aoFechar) {
  const atual = useRef({ aoFecharTeclado, aoFechar });
  atual.current = { aoFecharTeclado, aoFechar };

  useEffect(() => {
    function tecla(e) {
      if (e.key === "Escape") atual.current.aoFecharTeclado();
    }
    function clique(e) {
      if (e.composedPath().includes(ancora.current)) return;
      // clique que já trocou de tela (logo, Meu perfil, sair): o painel fecha sozinho
      if (!window.location.search.includes("atendimentos=1")) return;
      atual.current.aoFechar();
    }
    document.addEventListener("keydown", tecla);
    document.addEventListener("click", clique);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("click", clique);
    };
  }, [ancora]);
}

// na busca fecha o painel e põe o cursor no campo; nas outras telas volta para a busca
function useIrParaBusca(fechar) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return () => {
    if (pathname === "/usuario") fechar();
    else navigate("/usuario");
    setTimeout(() => document.getElementById("bus-q")?.focus(), 0);
  };
}

function PainelSuspenso({ ancora, aoFechar, aoFecharTeclado }) {
  const t = useTextos(traducoes).atendimentos;
  const { grupos, carregar, trocar } = useAtendimentos();
  const [aba, setAba] = useState("proximos");
  const [aviso, setAviso] = useState("");
  const [topo, setTopo] = useState(0);
  const avisoCancelado = useRef(null);
  const irParaBusca = useIrParaBusca(aoFechar);

  useFecharFora(ancora, aoFecharTeclado, aoFechar);
  useEffect(carregar, [carregar]);

  // a altura que sobra embaixo do cabeçalho; no celular o painel ocupa a largura toda
  useLayoutEffect(() => {
    function medir() {
      setTopo(ancora.current?.closest(".usu-topo")?.getBoundingClientRect().bottom ?? 0);
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [ancora]);

  useEffect(() => {
    if (aviso) avisoCancelado.current?.focus();
  }, [aviso]);

  function cancelado(atualizado) {
    trocar(atualizado);
    setAviso(t.cancelado);
  }

  const estado = useEstadoLista();
  const agora = new Date();
  const itens = grupos[aba];

  return (
    <div id="ma-pop" className="ma-pop" role="dialog" aria-label={t.titulo} style={{ "--ma-topo": `${topo}px` }}>
      <strong className="ma-pop-topo">{t.titulo}</strong>
      {estado ?? (
        <>
          {aviso && (
            <p className="ma-aviso" role="status" tabIndex={-1} ref={avisoCancelado}>
              <Svg nome="check" tamanho={18} /> {aviso}
            </p>
          )}
          <Abas aba={aba} aoEscolher={setAba} />
          <div id="ma-pop-painel" role="tabpanel" aria-labelledby={`ma-pop-aba-${aba}`} className="ma-pop-painel">
            {itens.length ? (
              <ul className="ma-pop-lista">
                {itens.map((a) => (
                  <ItemCompacto key={a.id} atendimento={a} agora={agora} aoCancelar={cancelado} aoAtualizar={trocar} />
                ))}
              </ul>
            ) : (
              <div className="ma-pop-vazio">
                <p>{t.vazio[aba]}</p>
                {aba === "proximos" && (
                  <button type="button" className="botao botao-primario" onClick={irParaBusca}>
                    {t.buscar}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// o botão do topo abre o painel por cima da tela atual, sem trocar de página
export default function BotaoAtendimentos() {
  const t = useTextos(traducoes);
  const { grupos, lista } = useAtendimentos();
  const { aberto, abrir, fechar } = useAbertura();
  const ancora = useRef(null);
  const botao = useRef(null);
  const proximos = grupos.proximos.length;

  // fechando pelo teclado com o foco lá dentro, o foco volta para o botão
  function fecharPeloTeclado() {
    if (ancora.current?.contains(document.activeElement)) botao.current?.focus();
    fechar();
  }

  return (
    <div className="ma-ancora" ref={ancora}>
      <button
        ref={botao}
        type="button"
        className={aberto ? "usu-nav usu-nav-atual ma-nav-botao" : "usu-nav ma-nav-botao"}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-controls={aberto ? "ma-pop" : undefined}
        onClick={aberto ? fechar : abrir}
      >
        <Svg nome="agenda" tamanho={17} /> {t.navAtendimentos}
        {lista && proximos > 0 && (
          <>
            <span className="ma-nav-contagem" aria-hidden="true">
              {proximos}
            </span>
            <span className="ma-sr">{t.atendimentos.contagemProximos(proximos)}</span>
          </>
        )}
      </button>
      {aberto && <PainelSuspenso ancora={ancora} aoFechar={fechar} aoFecharTeclado={fecharPeloTeclado} />}
    </div>
  );
}
