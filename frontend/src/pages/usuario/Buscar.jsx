import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { Bandeira } from "../../components/SeletorIdioma";
import { useAuth } from "../../context/AuthContext";
import { localeAtual, useIdioma, useTextos } from "../../context/IdiomaContext";
import { nomeDaArea, visualDaArea } from "../../dados/areas";
import { traduzirErroApi } from "../../services/errosApi";
import { nomeDoIdioma } from "../voluntario/usePainel";
import { Svg, quando } from "../voluntario/comum";
import { Esqueleto, IconeArea, momento, totalPorArea, useTodos } from "./comum";
import FiltroQuando from "./FiltroQuando";
import useBusca from "./useBusca";
import { traducoes } from "./traducoes";
import "./busca.css";

const IDIOMAS = ["pt", "en", "es", "fr"];
const TURNOS = ["manha", "tarde", "noite"];
// a API manda todos de uma vez e a tela mostra de 12 em 12: 12 fecha a linha com 1, 2, 3 ou 4 colunas
const POR_VEZ = 12;

// o número só aparece quando a API respondeu; antes disso, um esqueleto no lugar
function Numero({ valor }) {
  return <strong>{valor ?? <Esqueleto className="bus-esq-numero" />}</strong>;
}

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
            <span className="bus-bandeiras" aria-label={voluntario.idiomas.length ? t.fala(voluntario.idiomas.map(nomeDoIdioma)) : undefined}>
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
  const total = todos && totalPorArea(todos);
  const resultados = useRef(null);

  const maisCedo = useMemo(
    () =>
      (todos ?? [])
        .map((v) => v.proximo_horario)
        .filter(Boolean)
        .sort((a, b) => momento(a) - momento(b))[0],
    [todos],
  );

  // a API já manda por nome, mas o SQLite põe "Élodie" e nome em minúscula depois do "Z"
  const lista = useMemo(() => [...busca.voluntarios].sort((a, b) => a.nome.localeCompare(b.nome, localeAtual())), [busca.voluntarios, idioma]);

  const areaEscolhida = busca.areas.find((a) => String(a.id) === filtros.area);

  const [visiveis, setVisiveis] = useState(POR_VEZ);
  // filtro novo volta para os 12 primeiros
  useEffect(() => setVisiveis(POR_VEZ), [filtros]);

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
            <Numero valor={todos?.length} />
            <span>{t.voluntariosProntos}</span>
          </li>
          <li>
            <Numero valor={busca.areasCarregadas ? busca.areas.length : null} />
            <span>{t.areasAtendimento}</span>
          </li>
          <li>
            <strong>4</strong>
            <span>{t.idiomasPlataforma}</span>
          </li>
          {/* sem nenhum horário livre o destaque vira "0 horários livres agora" */}
          <li className="bus-numero-destaque">
            <Numero valor={maisCedo ? `${quando(momento(maisCedo))}, ${maisCedo.hora_inicio}` : todos && 0} />
            <span>{maisCedo || !todos ? t.proximoLivre : t.semLivreAgora}</span>
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
                  <small>{total ? t.voluntarios(total.get(a.id) ?? 0) : <Esqueleto className="bus-esq-linha" />}</small>
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
          {busca.temFiltro && (
            <button type="button" className="bus-link" onClick={busca.limpar}>
              {t.limparFiltros}
            </button>
          )}
        </div>

        <div className="bus-filtros">
          <div className="bus-filtro">
            <span id="bus-rotulo-idioma" className="bus-filtro-rotulo">
              {t.idioma}
            </span>
            <div className="bus-segmento" role="group" aria-labelledby="bus-rotulo-idioma">
              <button type="button" className={filtros.idioma ? "" : "bus-ligada"} aria-pressed={!filtros.idioma} onClick={() => busca.mudar("idioma", "")}>
                {t.todos}
              </button>
              {IDIOMAS.map((codigo) => {
                const ligado = filtros.idioma === codigo;
                return (
                  <button
                    key={codigo}
                    type="button"
                    className={ligado ? "bus-ligada" : ""}
                    aria-pressed={ligado}
                    aria-label={nomeDoIdioma(codigo)}
                    title={nomeDoIdioma(codigo)}
                    onClick={() => busca.mudar("idioma", ligado ? "" : codigo)}
                  >
                    <Bandeira codigo={codigo} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bus-filtro">
            <span id="bus-rotulo-turno" className="bus-filtro-rotulo">
              {t.turno}
            </span>
            <div className="bus-segmento" role="group" aria-labelledby="bus-rotulo-turno">
              {TURNOS.map((turno) => {
                const ligado = filtros.turno === turno;
                return (
                  <button key={turno} type="button" className={ligado ? "bus-ligada" : ""} aria-pressed={ligado} onClick={() => busca.mudar("turno", ligado ? "" : turno)}>
                    {t.turnos[turno]}
                  </button>
                );
              })}
            </div>
          </div>

          <FiltroQuando valor={filtros.quando} aoMudar={(valor) => busca.mudar("quando", valor)} />
        </div>

        {busca.erro ? (
          <>
            <p className="aviso" role="alert">
              {traduzirErroApi(busca.erro)}
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
          <>
            <ul className="bus-grade">
              {/* a ordem conta dentro de cada leva, para os novos cartões subirem sem esperar */}
              {lista.slice(0, visiveis).map((v, i) => (
                <Cartao key={v.id} voluntario={v} ordem={i % POR_VEZ} />
              ))}
            </ul>
            {lista.length > visiveis && (
              <div className="bus-mais">
                <span className="bus-mais-texto" aria-live="polite">
                  {t.mostrando(visiveis, lista.length)}
                </span>
                <span className="bus-mais-barra" aria-hidden="true">
                  <span style={{ width: `${(visiveis / lista.length) * 100}%` }} />
                </span>
                <button type="button" onClick={() => setVisiveis((n) => n + POR_VEZ)}>
                  {t.mostrarMais} <Svg nome="descer" tamanho={18} />
                </button>
              </div>
            )}
          </>
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
