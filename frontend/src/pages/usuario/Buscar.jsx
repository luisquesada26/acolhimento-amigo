import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { visualDaArea } from "../../dados/areas";
import { nomeDoIdioma } from "../voluntario/usePainel";
import { Svg, quando } from "../voluntario/comum";
import useBusca from "./useBusca";

const IDIOMAS = ["pt", "en", "es", "fr"];

function EtiquetaArea({ nome }) {
  const { cor, fundo } = visualDaArea(nome);
  return (
    <span className="usu-area" style={{ background: fundo, color: cor }}>
      {nome}
    </span>
  );
}

function CartaoVoluntario({ voluntario }) {
  const { proximo_horario: proximo } = voluntario;

  return (
    <li className="usu-cartao">
      <div className="usu-cartao-topo">
        <Avatar nome={voluntario.nome} foto={voluntario.foto} className="usu-cartao-avatar" />
        <div className="usu-cartao-quem">
          <h2>{voluntario.nome}</h2>
          <EtiquetaArea nome={voluntario.area} />
        </div>
      </div>

      {voluntario.bio && <p className="usu-cartao-bio">{voluntario.bio}</p>}

      <ul className="usu-cartao-dados">
        <li>
          <Svg nome="idioma" tamanho={15} /> Fala {voluntario.idiomas.map((i) => nomeDoIdioma(i).toLowerCase()).join(", ")}
        </li>
        <li>
          <Svg nome="servicos" tamanho={15} /> {voluntario.servicos.map((s) => s.titulo).join(" · ")}
        </li>
        <li>
          <Svg nome="agenda" tamanho={15} />{" "}
          {proximo ? (
            <>
              Próximo horário {quando(new Date(`${proximo.data}T${proximo.hora_inicio}:00`)).toLowerCase()}, às {proximo.hora_inicio}
            </>
          ) : (
            "Sem horários livres no momento"
          )}
        </li>
      </ul>

      <Link to={`/usuario/voluntario/${voluntario.id}`} className="botao botao-primario usu-cartao-botao">
        Ver horários e marcar
      </Link>
    </li>
  );
}

export default function Buscar() {
  const busca = useBusca();
  const { filtros } = busca;

  return (
    <>
      <header className="usu-cabecalho">
        <h1>Encontre um voluntário</h1>
        <p>Atendimento online e gratuito. Escolha a área, o idioma e marque o horário que der para você.</p>
      </header>

      <section className="usu-bloco" aria-labelledby="usu-filtros-titulo">
        <h2 id="usu-filtros-titulo" className="usu-bloco-titulo">
          Filtros
        </h2>
        <div className="usu-filtros">
          <div className="campo usu-filtro-busca">
            <label htmlFor="usu-q">Buscar</label>
            <div className="usu-busca-campo">
              <Svg nome="busca" tamanho={18} />
              <input
                id="usu-q"
                type="search"
                value={filtros.q}
                onChange={(e) => busca.mudar("q", e.target.value)}
                placeholder="Ex.: visto, protocolo, currículo"
              />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="usu-area">Área</label>
            <select id="usu-area" value={filtros.area} onChange={(e) => busca.mudar("area", e.target.value)}>
              <option value="">Todas as áreas</option>
              {busca.areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="usu-idioma">Idioma</label>
            <select id="usu-idioma" value={filtros.idioma} onChange={(e) => busca.mudar("idioma", e.target.value)}>
              <option value="">Qualquer idioma</option>
              {IDIOMAS.map((i) => (
                <option key={i} value={i}>
                  {nomeDoIdioma(i)}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="usu-disponivel">Disponibilidade</label>
            <select id="usu-disponivel" value={filtros.disponivel} onChange={(e) => busca.mudar("disponivel", e.target.value)}>
              <option value="">Qualquer data</option>
              <option value="semana">Com horário nos próximos 7 dias</option>
            </select>
          </div>
        </div>
      </section>

      <section className="usu-bloco" aria-labelledby="usu-resultado-titulo">
        <div className="usu-bloco-topo">
          <h2 id="usu-resultado-titulo" className="usu-bloco-titulo" aria-live="polite">
            {busca.carregando
              ? "Buscando..."
              : `${busca.voluntarios.length} ${busca.voluntarios.length === 1 ? "voluntário" : "voluntários"}`}
          </h2>
          {busca.temFiltro && (
            <button type="button" className="vol-botao-secundario" onClick={busca.limpar}>
              Limpar filtros
            </button>
          )}
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
        ) : busca.voluntarios.length ? (
          <ul className="usu-grade">
            {busca.voluntarios.map((v) => (
              <CartaoVoluntario key={v.id} voluntario={v} />
            ))}
          </ul>
        ) : (
          !busca.carregando && (
            <p className="vol-vazio">
              {busca.temFiltro
                ? "Nenhum voluntário com esses filtros. Tente tirar algum."
                : "Nenhum voluntário disponível no momento."}
            </p>
          )
        )}
      </section>
    </>
  );
}
