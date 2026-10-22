import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { nomeDoIdioma } from "./usePainel";
import { OrdenarPorData, Status, Svg, dataComAno } from "./comum";
import DetalheAtendimento from "./DetalheAtendimento";

// busca sem diferenciar maiúscula nem acento ("maria" acha "María")
const normalizar = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const unicos = (lista) => [...new Set(lista)].sort((a, b) => a.localeCompare(b, "pt-BR"));

export default function Relatorios() {
  const painel = useOutletContext();
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [servico, setServico] = useState("");
  const [pais, setPais] = useState("");
  const [ordem, setOrdem] = useState("desc");
  const [abertoId, setAbertoId] = useState(null);

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
        <h1>Relatórios</h1>
        <p>Todas as pessoas que marcaram atendimento com você.</p>
      </header>

      <section className="painel-cartao" aria-labelledby="filtros-titulo">
        <h2 id="filtros-titulo" className="painel-titulo">
          Filtros
        </h2>
        <div className="relatorio-filtros">
          <div className="campo relatorio-busca">
            <label htmlFor="relatorio-busca">Buscar pessoa</label>
            <div className="relatorio-busca-campo">
              <Svg nome="busca" tamanho={18} />
              <input id="relatorio-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome da pessoa" />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="relatorio-de">De</label>
            <input id="relatorio-de" type="date" value={de} max={ate || undefined} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="relatorio-ate">Até</label>
            <input id="relatorio-ate" type="date" value={ate} min={de || undefined} onChange={(e) => setAte(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="relatorio-servico">Serviço</label>
            <select id="relatorio-servico" value={servico} onChange={(e) => setServico(e.target.value)}>
              <option value="">Todos</option>
              {servicos.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="relatorio-pais">Nacionalidade</label>
            <select id="relatorio-pais" value={pais} onChange={(e) => setPais(e.target.value)}>
              <option value="">Todas</option>
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
            {filtrados.length} {filtrados.length === 1 ? "atendimento" : "atendimentos"} · {pessoas} {pessoas === 1 ? "pessoa" : "pessoas"}
          </h2>
          {temFiltro && (
            <button type="button" className="vol-botao-secundario" onClick={limpar}>
              Limpar filtros
            </button>
          )}
        </div>

        {filtrados.length ? (
          <div className="historico-rolagem">
            <table className="historico-tabela">
              <thead>
                <tr>
                  <th scope="col">Pessoa</th>
                  <th scope="col">Nacionalidade</th>
                  <th scope="col">Serviço</th>
                  <th scope="col" aria-sort={ordem === "desc" ? "descending" : "ascending"}>
                    <OrdenarPorData ordem={ordem} aoMudar={setOrdem} />
                  </th>
                  <th scope="col">Situação</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((a) => (
                  <tr key={a.id} className="historico-clicavel" onClick={() => setAbertoId(a.id)}>
                    <td>
                      <button type="button" className="historico-abrir" onClick={(e) => (e.stopPropagation(), setAbertoId(a.id))}>
                        {a.usuario.nome}
                      </button>
                      <small>fala {nomeDoIdioma(a.usuario.idioma).toLowerCase()}</small>
                    </td>
                    <td>{a.usuario.pais_origem}</td>
                    <td>{a.servico.titulo}</td>
                    <td>
                      <time dateTime={`${a.horario.data}T${a.horario.hora_inicio}`}>
                        <strong>{dataComAno(a.inicio)}</strong>
                        <small>
                          {a.horario.hora_inicio} às {a.horario.hora_fim}
                        </small>
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
          <p className="vol-vazio">{todos.length ? "Ninguém encontrado com esses filtros." : "Quando alguém marcar atendimento com você, aparece aqui."}</p>
        )}
      </section>

      <DetalheAtendimento atendimento={painel.todos.find((a) => a.id === abertoId) ?? null} aoFechar={() => setAbertoId(null)} painel={painel} />
    </>
  );
}
