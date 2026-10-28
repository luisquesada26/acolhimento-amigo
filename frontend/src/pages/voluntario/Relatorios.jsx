import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { OrdenarPorData, Status, Svg, dataComAno } from "./comum";
import DetalheAtendimento from "./DetalheAtendimento";
import { localeAtual, useTextos } from "../../context/IdiomaContext";
import { traducoes } from "./traducoes";

// busca sem diferenciar maiúscula nem acento ("maria" acha "María")
const normalizar = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const unicos = (lista) => [...new Set(lista)].sort((a, b) => a.localeCompare(b, localeAtual()));

export default function Relatorios() {
  const painel = useOutletContext();
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [servico, setServico] = useState("");
  const [pais, setPais] = useState("");
  const [ordem, setOrdem] = useState("desc");
  const [abertoId, setAbertoId] = useState(null);
  const t = useTextos(traducoes);

  const todos = [...painel.todos].sort((a, b) => (ordem === "desc" ? b.inicio - a.inicio : a.inicio - b.inicio));
  const servicos = unicos(todos.map((a) => a.servico.titulo));
  const paises = unicos(todos.map((a) => a.usuario.pais_origem).filter(Boolean));

  const filtrados = todos.filter(
    (a) =>
      (!busca || normalizar(a.usuario.nome).includes(normalizar(busca.trim()))) &&
      (!de || a.horario.data >= de) &&
      (!ate || a.horario.data <= ate) &&
      (!servico || a.servico.titulo === servico) &&
      (!pais || a.usuario.pais_origem === pais)
  );
  const pessoas = new Set(filtrados.map((a) => a.usuario.id)).size;
  const temFiltro = busca || de || ate || servico || pais;

  function limpar() {
    setBusca("");
    setDe("");
    setAte("");
    setServico("");
    setPais("");
  }

  return (
    <>
      <header className="painel-cabecalho">
        <h1>{t.relatoriosTitulo}</h1>
        <p>{t.relatoriosSubtitulo}</p>
      </header>

      <section className="painel-cartao" aria-labelledby="filtros-titulo">
        <h2 id="filtros-titulo" className="painel-titulo">
          {t.filtros}
        </h2>
        <div className="relatorio-filtros">
          <div className="campo relatorio-busca">
            <label htmlFor="relatorio-busca">{t.buscarPessoa}</label>
            <div className="relatorio-busca-campo">
              <Svg nome="busca" tamanho={18} />
              <input id="relatorio-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.nomePessoa} />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="relatorio-de">{t.de}</label>
            <input id="relatorio-de" type="date" value={de} max={ate || undefined} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="relatorio-ate">{t.ate}</label>
            <input id="relatorio-ate" type="date" value={ate} min={de || undefined} onChange={(e) => setAte(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="relatorio-servico">{t.servico}</label>
            <select id="relatorio-servico" value={servico} onChange={(e) => setServico(e.target.value)}>
              <option value="">{t.todos}</option>
              {servicos.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="relatorio-pais">{t.nacionalidade}</label>
            <select id="relatorio-pais" value={pais} onChange={(e) => setPais(e.target.value)}>
              <option value="">{t.todas}</option>
              {paises.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="painel-cartao" aria-labelledby="resultado-titulo">
        <div className="painel-cartao-topo">
          <h2 id="resultado-titulo" className="painel-titulo" aria-live="polite">
            {t.resultado(filtrados.length, pessoas)}
          </h2>
          {temFiltro && (
            <button type="button" className="vol-botao-secundario" onClick={limpar}>
              {t.limparFiltros}
            </button>
          )}
        </div>

        {filtrados.length ? (
          <div className="historico-rolagem">
            <table className="historico-tabela">
              <thead>
                <tr>
                  <th scope="col">{t.pessoa}</th>
                  <th scope="col">{t.nacionalidade}</th>
                  <th scope="col">{t.servico}</th>
                  <th scope="col" aria-sort={ordem === "desc" ? "descending" : "ascending"}>
                    <OrdenarPorData ordem={ordem} aoMudar={setOrdem} />
                  </th>
                  <th scope="col">{t.situacao}</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((a) => (
                  <tr key={a.id} className="historico-clicavel" onClick={() => setAbertoId(a.id)}>
                    <td>
                      <button type="button" className="historico-abrir" onClick={(e) => (e.stopPropagation(), setAbertoId(a.id))}>
                        {a.usuario.nome}
                      </button>
                      <small>{t.fala(a.usuario.idiomas)}</small>
                    </td>
                    <td>{a.usuario.pais_origem}</td>
                    <td>{a.servico.titulo}</td>
                    <td>
                      <time dateTime={`${a.horario.data}T${a.horario.hora_inicio}`}>
                        <strong>{dataComAno(a.inicio)}</strong>
                        <small>{t.intervalo(a.horario.hora_inicio, a.horario.hora_fim)}</small>
                      </time>
                    </td>
                    <td>
                      <Status status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="vol-vazio">{todos.length ? t.ninguemEncontrado : t.relatoriosVazio}</p>
        )}
      </section>

      <DetalheAtendimento atendimento={painel.todos.find((a) => a.id === abertoId) ?? null} aoFechar={() => setAbertoId(null)} painel={painel} />
    </>
  );
}
