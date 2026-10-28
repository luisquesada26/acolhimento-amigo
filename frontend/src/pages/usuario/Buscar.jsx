import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { Bandeira } from "../../components/SeletorIdioma";
import { useAuth } from "../../context/AuthContext";
import { visualDaArea } from "../../dados/areas";
import { nomeDoIdioma } from "../voluntario/usePainel";
import { Svg, quando } from "../voluntario/comum";
import { Esqueleto, IconeArea, momento, totalPorArea, useTodos } from "./comum";
import useBusca from "./useBusca";
import "./busca.css";

function Cartao({ voluntario, ordem }) {
  const { cor, fundo } = visualDaArea(voluntario.area);
  const proximo = voluntario.proximo_horario;

  return (
    <li className="bus-cartao" style={{ "--cor": cor, "--fundo": fundo, animationDelay: `${Math.min(ordem, 15) * 30}ms` }}>
      <Link to={`/usuario/voluntario/${voluntario.id}`} className="bus-cartao-link">
        <span className="bus-cartao-area">
          <IconeArea nome={voluntario.area} tamanho={15} /> {voluntario.area}
        </span>
        <span className="bus-cartao-pessoa">
          <Avatar nome={voluntario.nome} foto={voluntario.foto} className="bus-avatar" />
          <span>
            <strong>{voluntario.nome}</strong>
            <span className="bus-bandeiras" aria-label={`Fala ${voluntario.idiomas.map(nomeDoIdioma).join(", ").toLowerCase()}`}>
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
                <small>Próximo horário</small>
                <strong>
                  {quando(momento(proximo))} · {proximo.hora_inicio}
                </strong>
              </>
            ) : (
              <small>Sem horário livre</small>
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
      return momento(a.proximo_horario) - momento(b.proximo_horario) || a.nome.localeCompare(b.nome, "pt-BR");
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
            <span className="bus-ponto" /> Atendimento online e gratuito
          </span>
          <h1>
            Olá, {usuario.nome.split(" ")[0]}.<br />
            <span>Quem pode te ajudar hoje?</span>
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
              Buscar
            </label>
            <input id="bus-q" type="search" value={filtros.q} onChange={(e) => busca.mudar("q", e.target.value)} placeholder="Visto, currículo, aluguel, SUS..." />
            <button type="submit">Buscar</button>
          </form>
        </div>

        <ul className="bus-numeros" aria-label="A plataforma em números">
          <li>
            <strong>{todos.length || "–"}</strong>
            <span>voluntários prontos para atender</span>
          </li>
          <li>
            <strong>{busca.areas.length || "–"}</strong>
            <span>áreas de atendimento</span>
          </li>
          <li>
            <strong>4</strong>
            <span>idiomas: português, inglês, espanhol e francês</span>
          </li>
          <li className="bus-numero-destaque">
            <strong>{maisCedo ? `${quando(momento(maisCedo))}, ${maisCedo.hora_inicio}` : "–"}</strong>
            <span>é o próximo horário livre</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="bus-areas-titulo">
        <div className="bus-secao-topo">
          <h2 id="bus-areas-titulo">Escolha pela área</h2>
          {filtros.area && (
            <button type="button" className="bus-link" onClick={() => busca.mudar("area", "")}>
              Ver todas as áreas
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
                  <strong>{a.nome}</strong>
                  <small>{total.get(a.id) ?? "–"} voluntários</small>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section ref={resultados} className="bus-resultados" aria-labelledby="bus-titulo">
        <div className="bus-secao-topo">
          <h2 id="bus-titulo" aria-live="polite">
            {busca.carregando
              ? "Buscando..."
              : `${lista.length} ${lista.length === 1 ? "voluntário" : "voluntários"}${areaEscolhida ? ` em ${areaEscolhida.nome}` : ""}`}
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
              Nesta semana
            </button>
            <div className="bus-segmento" role="group" aria-label="Ordenar">
              <button type="button" className={ordem === "horario" ? "bus-ligada" : ""} aria-pressed={ordem === "horario"} onClick={() => setOrdem("horario")}>
                Mais cedo
              </button>
              <button type="button" className={ordem === "nome" ? "bus-ligada" : ""} aria-pressed={ordem === "nome"} onClick={() => setOrdem("nome")}>
                Nome
              </button>
            </div>
            {busca.temFiltro && (
              <button type="button" className="bus-link" onClick={busca.limpar}>
                Limpar filtros
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
              Tentar de novo
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
            <strong>Ninguém com esses filtros</strong>
            <span>Tente outra palavra ou tire a disponibilidade.</span>
            <button type="button" className="bus-link" onClick={busca.limpar}>
              Limpar filtros
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
