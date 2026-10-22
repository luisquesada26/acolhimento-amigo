import { useState } from "react";
import { OrdenarPorData, Status, dataComAno } from "./comum";

const FILTROS = [
  { chave: "todos", nome: "Todos" },
  { chave: "realizado", nome: "Realizados" },
  { chave: "cancelado", nome: "Cancelados" },
];

// atendimentos que já passaram, em tabela, com filtro pela situação
// com aoAbrir, clicar na linha abre o atendimento
export default function Historico({ passados, aoAbrir }) {
  const [filtro, setFiltro] = useState("todos");
  const [ordem, setOrdem] = useState("desc");
  const itens = (filtro === "todos" ? passados : passados.filter((a) => a.status === filtro))
    .slice()
    .sort((a, b) => (ordem === "desc" ? b.inicio - a.inicio : a.inicio - b.inicio));
  const contar = (chave) => (chave === "todos" ? passados.length : passados.filter((a) => a.status === chave).length);

  return (
    <section className="painel-cartao" aria-labelledby="historico-titulo">
      <div className="historico-topo">
        <h2 id="historico-titulo" className="painel-titulo">
          Histórico
        </h2>
        <div className="historico-filtros" role="group" aria-label="Filtrar o histórico">
          {FILTROS.map((f) => (
            <button key={f.chave} type="button" aria-pressed={filtro === f.chave} onClick={() => setFiltro(f.chave)}>
              {f.nome} ({contar(f.chave)})
            </button>
          ))}
        </div>
      </div>

      {itens.length ? (
        <div className="historico-rolagem">
          <table className="historico-tabela">
            <thead>
              <tr>
                <th scope="col" aria-sort={ordem === "desc" ? "descending" : "ascending"}>
                  <OrdenarPorData ordem={ordem} aoMudar={setOrdem} />
                </th>
                <th scope="col">Pessoa</th>
                <th scope="col">Serviço</th>
                <th scope="col">Situação</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((a) => (
                <tr key={a.id} className={aoAbrir ? "historico-clicavel" : undefined} onClick={aoAbrir ? () => aoAbrir(a.id) : undefined}>
                  <td>
                    <time dateTime={`${a.horario.data}T${a.horario.hora_inicio}`}>
                      <strong>{dataComAno(a.inicio)}</strong>
                      <small>
                        {a.horario.hora_inicio} às {a.horario.hora_fim}
                      </small>
                    </time>
                  </td>
                  <td>
                    {aoAbrir ? (
                      <button type="button" className="historico-abrir" onClick={(e) => (e.stopPropagation(), aoAbrir(a.id))}>
                        {a.usuario.nome}
                      </button>
                    ) : (
                      <strong>{a.usuario.nome}</strong>
                    )}
                    <small>{a.usuario.pais_origem}</small>
                  </td>
                  <td>{a.servico.titulo}</td>
                  <td>
                    <Status status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="vol-vazio">Seus atendimentos que já aconteceram aparecem aqui.</p>
      )}
    </section>
  );
}
