import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { lerErro } from "../../services/api";
import Avatar from "../../components/Avatar";
import { localeAtual, useTextos } from "../../context/IdiomaContext";
import { Svg, diaExtenso, quando } from "../voluntario/comum";
import { EtiquetaArea, momento } from "./comum";
import { situacao, useAtendimentos } from "./useAtendimentos";
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

function Cancelar({ atendimento, aoCancelar }) {
  const t = useTextos(traducoes).atendimentos;
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

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

  if (!confirmando) {
    return (
      <button type="button" className="ma-botao-perigo" onClick={() => setConfirmando(true)}>
        {t.cancelar}
      </button>
    );
  }

  return (
    <div className="ma-confirmar" role="alertdialog" aria-labelledby={`ma-confirmar-${atendimento.id}`}>
      <p id={`ma-confirmar-${atendimento.id}`}>{t.cancelarConfirmar}</p>
      {erro && <span className="campo-erro">{erro}</span>}
      <div className="ma-confirmar-acoes">
        <button type="button" className="ma-botao" onClick={() => setConfirmando(false)} disabled={enviando}>
          {t.manter}
        </button>
        <button type="button" className="ma-botao-perigo ma-botao-perigo-cheio" onClick={cancelar} disabled={enviando}>
          {enviando ? t.cancelando : t.simCancelar}
        </button>
      </div>
    </div>
  );
}

function Atendimento({ atendimento: a, agora, destaque = false, aoCancelar }) {
  const t = useTextos(traducoes).atendimentos;
  const inicio = momento(a.horario);
  const estado = situacao(a, agora);

  return (
    <article className={destaque ? "ma-item ma-item-destaque" : "ma-item"} aria-label={`${diaExtenso(inicio)}, ${a.horario.hora_inicio}`}>
      <Data inicio={inicio} />

      <div className="ma-corpo">
        <p className="ma-quando">
          <Svg nome="relogio" tamanho={15} />
          {t.horario(a.horario.hora_inicio, a.horario.hora_fim)}
          {estado === "confirmado" && <span className="ma-relativo">{quando(inicio)}</span>}
        </p>
        <h3>{a.servico.titulo}</h3>
        <Link to={`/usuario/voluntario/${a.voluntario.id}`} className="ma-voluntario">
          <Avatar nome={a.voluntario.nome} foto={a.voluntario.foto} className="ma-avatar" />
          <span>
            <strong>{a.voluntario.nome}</strong>
            {a.voluntario.area && <EtiquetaArea nome={a.voluntario.area} />}
          </span>
        </Link>
        {a.descricao && (
          <blockquote className="ma-caso">
            <small>{t.voceContou}</small>
            {a.descricao}
          </blockquote>
        )}
        {estado === "aguardando" && <p className="ma-dica">{t.aguardandoDica}</p>}
      </div>

      <div className="ma-lado">
        <span className={`ma-status ma-status-${estado}`}>{t.status[estado]}</span>
        {estado === "confirmado" ? (
          <Cancelar atendimento={a} aoCancelar={aoCancelar} />
        ) : (
          <Link to={`/usuario/voluntario/${a.voluntario.id}`} className="ma-botao">
            {estado === "realizado" || estado === "cancelado" ? t.marcarDeNovo : t.verPerfil}
          </Link>
        )}
      </div>
    </article>
  );
}

// tudo o que a pessoa marcou: o que vem por aí, o que já passou e o que foi cancelado
export default function MeusAtendimentos() {
  const t = useTextos(traducoes).atendimentos;
  const { lista, erro, grupos, carregar, trocar } = useAtendimentos();
  const [aba, setAba] = useState("proximos");
  const [aviso, setAviso] = useState("");

  useEffect(carregar, [carregar]);

  const agora = new Date();

  function cancelado(atualizado) {
    trocar(atualizado);
    setAviso(t.cancelado);
  }

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

  const [proximo, ...outros] = grupos.proximos;
  const itens = aba === "proximos" ? outros : grupos[aba];
  const vazio = aba === "proximos" ? !proximo : !itens.length;

  return (
    <div className="ma">
      <header className="ma-titulo">
        <h1>{t.titulo}</h1>
        <p>{t.subtitulo}</p>
      </header>

      {aviso && (
        <p className="ma-aviso" role="status">
          <Svg nome="check" tamanho={18} /> {aviso}
        </p>
      )}

      <div className="ma-abas" role="tablist" aria-label={t.abas}>
        {ABAS.map((chave) => (
          <button
            key={chave}
            type="button"
            role="tab"
            id={`ma-aba-${chave}`}
            aria-selected={aba === chave}
            aria-controls="ma-painel"
            className={aba === chave ? "ma-aba ma-aba-ligada" : "ma-aba"}
            onClick={() => setAba(chave)}
          >
            {t[chave]}
            <span className="ma-contagem">{grupos[chave].length}</span>
          </button>
        ))}
      </div>

      <section id="ma-painel" role="tabpanel" aria-labelledby={`ma-aba-${aba}`} className="ma-painel">
        {aba === "proximos" && proximo && (
          <div className="ma-destaque">
            <span className="ma-destaque-rotulo">{t.destaque}</span>
            <Atendimento atendimento={proximo} agora={agora} destaque aoCancelar={cancelado} />
          </div>
        )}

        {vazio ? (
          <div className="ma-vazio">
            <Svg nome="agenda" tamanho={28} />
            <p>{t.vazio[aba]}</p>
            {aba === "proximos" && (
              <Link to="/usuario" className="botao botao-primario">
                {t.buscar}
              </Link>
            )}
          </div>
        ) : (
          <div className="ma-lista">
            {itens.map((a) => (
              <Atendimento key={a.id} atendimento={a} agora={agora} aoCancelar={cancelado} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
