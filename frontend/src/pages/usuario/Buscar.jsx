import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { Bandeira } from "../../components/SeletorIdioma";
import { useAuth } from "../../context/AuthContext";
import { localeAtual, useIdioma, useTextos } from "../../context/IdiomaContext";
import { nomeDaArea, visualDaArea } from "../../dados/areas";
import { nomeDoIdioma } from "../voluntario/usePainel";
import { Svg, quando } from "../voluntario/comum";
import { Esqueleto, IconeArea, momento, totalPorArea, useTodos } from "./comum";
import useBusca from "./useBusca";
import { traducoes } from "./traducoes";
import "./busca.css";

function Cartao({ voluntario, ordem }) {
  const { idioma } = useIdioma();
  const t = useTextos(traducoes);
  const { cor, fundo } = visualDaArea(voluntario.area);
  const proximo = voluntario.proximo_horario;

  return (
    <li className="bus-cartao" style={{ "--cor": cor, "--fundo": fundo, animationDelay: `${Math.min(ordem, 15) * 30}ms` }}>
      <Link to={`/usuario/voluntario/${voluntario.id}`} className="bus-cartao-link">
        <span className="bus-cartao-area">
          <IconeArea nome={voluntario.area} tamanho={15} /> {nomeDaArea(voluntario.area, idioma)}
        </span>
        <span className="bus-cartao-pessoa">
          <Avatar nome={voluntario.nome} foto={voluntario.foto} className="bus-avatar" />
          <span>
            <strong>{voluntario.nome}</strong>
            <span className="bus-bandeiras" aria-label={t.fala(voluntario.idiomas.map(nomeDoIdioma))}>
              {voluntario.idiomas.map((i) => (
                <Bandeira key={i} codigo={i} />
              ))}
            </span>
          </span>
        </span>
        <span className="bus-bio">{voluntario.bio}</span>
        <span className="bus-tags">
          {voluntario.servicos.map((s) => (
            <span key={s.id}>{s.titulo}</span>
          ))}
        </span>
        <span className="bus-cartao-pe">
          <span className="bus-quando">
            {proximo ? (
              <>
                <small>{t.busca.proximoHorario}</small>
                <strong>
                  {quando(momento(proximo))} · {proximo.hora_inicio}
                </strong>
              </>
            ) : (
              <small>{t.busca.semHorario}</small>
            )}
          </span>
          <span className="bus-seta" aria-hidden="true">
            <Svg nome="proximo" tamanho={18} />
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function Buscar() {
  const busca = useBusca();
  const { filtros } = busca;
  const { usuario } = useAuth();
  const { idioma } = useIdioma();
  const t = useTextos(traducoes).busca;
  const todos = useTodos();
  const total = totalPorArea(todos);
  const resultados = useRef(null);
  const [ordem, setOrdem] = useState("horario");

  const maisCedo = useMemo(
    () =>
      todos
        .map((v) => v.proximo_horario)
        .filter(Boolean)
        .sort((a, b) => momento(a) - momento(b))[0],
    [todos],
  );

  const lista = useMemo(() => {
    if (ordem === "nome") return busca.voluntarios;
    return [...busca.voluntarios].sort((a, b) => {
      if (!a.proximo_horario) return 1;
      if (!b.proximo_horario) return -1;
      return momento(a.proximo_horario) - momento(b.proximo_horario) || a.nome.localeCompare(b.nome, localeAtual());
    });
  }, [busca.voluntarios, ordem]);

  const areaEscolhida = busca.areas.find((a) => String(a.id) === filtros.area);

  function irParaResultados() {
    resultados.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="bus">
      <section className="bus-topo">
        <div className="bus-topo-texto">
          <span className="bus-selo">
            <span className="bus-ponto" /> {t.selo}
          </span>
          <h1>
            {t.ola(usuario.nome.split(" ")[0])}
            <br />
            <span>{t.quemAjuda}</span>
          </h1>
          <form
            className="bus-busca"
            onSubmit={(e) => {
              e.preventDefault();
              irParaResultados();
            }}
          >
            <Svg nome="busca" tamanho={22} />
            <label htmlFor="bus-q" className="bus-sr">
              {t.buscar}
            </label>
            <input id="bus-q" type="search" value={filtros.q} onChange={(e) => busca.mudar("q", e.target.value)} placeholder={t.exemplo} />
            <button type="submit">{t.buscar}</button>
          </form>
        </div>

        <ul className="bus-numeros" aria-label={t.numerosRotulo}>
          <li>
            <strong>{todos.length || "–"}</strong>
            <span>{t.voluntariosProntos}</span>
          </li>
          <li>
            <strong>{busca.areas.length || "–"}</strong>
            <span>{t.areasAtendimento}</span>
          </li>
          <li>
            <strong>4</strong>
            <span>{t.idiomasPlataforma}</span>
          </li>
          <li className="bus-numero-destaque">
            <strong>{maisCedo ? `${quando(momento(maisCedo))}, ${maisCedo.hora_inicio}` : "–"}</strong>
            <span>{t.proximoLivre}</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="bus-areas-titulo">
        <div className="bus-secao-topo">
          <h2 id="bus-areas-titulo">{t.escolhaArea}</h2>
          {filtros.area && (
            <button type="button" className="bus-link" onClick={() => busca.mudar("area", "")}>
              {t.verTodasAreas}
            </button>
          )}
        </div>
        <ul className="bus-mosaico">
          {busca.areas.map((a) => {
            const { cor, fundo } = visualDaArea(a.nome);
            const ligada = filtros.area === String(a.id);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  className={ligada ? "bus-area bus-area-ligada" : "bus-area"}
                  style={{ "--cor": cor, "--fundo": fundo }}
                  aria-pressed={ligada}
                  onClick={() => {
                    busca.mudar("area", ligada ? "" : String(a.id));
                    if (!ligada) irParaResultados();
                  }}
                >
                  <span className="bus-area-icone">
                    <IconeArea nome={a.nome} tamanho={22} />
                  </span>
                  <strong>{nomeDaArea(a.nome, idioma)}</strong>
                  <small>{total.has(a.id) ? t.voluntarios(total.get(a.id)) : "–"}</small>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section ref={resultados} className="bus-resultados" aria-labelledby="bus-titulo">
        <div className="bus-secao-topo">
          <h2 id="bus-titulo" aria-live="polite">
            {busca.carregando ? t.buscando : t.resultado(lista.length, areaEscolhida && nomeDaArea(areaEscolhida.nome, idioma))}
          </h2>
          <div className="bus-controles">
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(filtros.disponivel)}
              className={filtros.disponivel ? "bus-chave bus-chave-ligada" : "bus-chave"}
              onClick={() => busca.mudar("disponivel", filtros.disponivel ? "" : "semana")}
            >
              <span className="bus-chave-trilho">
                <span />
              </span>
              {t.nestaSemana}
            </button>
            <div className="bus-segmento" role="group" aria-label={t.ordenar}>
              <button type="button" className={ordem === "horario" ? "bus-ligada" : ""} aria-pressed={ordem === "horario"} onClick={() => setOrdem("horario")}>
                {t.maisCedo}
              </button>
              <button type="button" className={ordem === "nome" ? "bus-ligada" : ""} aria-pressed={ordem === "nome"} onClick={() => setOrdem("nome")}>
                {t.nome}
              </button>
            </div>
            {busca.temFiltro && (
              <button type="button" className="bus-link" onClick={busca.limpar}>
                {t.limparFiltros}
              </button>
            )}
          </div>
        </div>

        {busca.erro ? (
          <>
            <p className="aviso" role="alert">
              {busca.erro}
            </p>
            <button type="button" className="botao botao-primario" onClick={busca.recarregar}>
              {t.tentarDeNovo}
            </button>
          </>
        ) : busca.carregando && !lista.length ? (
          <ul className="bus-grade">
            {[0, 1, 2, 3].map((i) => (
              <li key={i}>
                <Esqueleto className="bus-esq-cartao" />
              </li>
            ))}
          </ul>
        ) : lista.length ? (
          <ul className="bus-grade">
            {lista.map((v, i) => (
              <Cartao key={v.id} voluntario={v} ordem={i} />
            ))}
          </ul>
        ) : (
          <div className="bus-vazio">
            <Svg nome="busca" tamanho={28} />
            <strong>{t.vazioTitulo}</strong>
            <span>{t.vazioTexto}</span>
            <button type="button" className="bus-link" onClick={busca.limpar}>
              {t.limparFiltros}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
