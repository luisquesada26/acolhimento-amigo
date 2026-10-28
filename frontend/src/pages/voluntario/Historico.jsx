import { useState } from "react";
import { OrdenarPorData, Status, dataComAno } from "./comum";
import { useTextos } from "../../context/IdiomaContext";
import { traducoes } from "./traducoes";

// o nome de cada filtro vem das traduções (filtrosHistorico)
const FILTROS = ["todos", "realizado", "cancelado"];

// atendimentos que já passaram, em tabela, com filtro pela situação
// com aoAbrir, clicar na linha abre o atendimento
export default function Historico({ passados, aoAbrir }) {
  const [filtro, setFiltro] = useState("todos");
  const [ordem, setOrdem] = useState("desc");
  const t = useTextos(traducoes);
  const itens = (filtro === "todos" ? passados : passados.filter((a) => a.status === filtro))
    .slice()
    .sort((a, b) => (ordem === "desc" ? b.inicio - a.inicio : a.inicio - b.inicio));
  const contar = (chave) => (chave === "todos" ? passados.length : passados.filter((a) => a.status === chave).length);

  return (
    <section className="painel-cartao" aria-labelledby="historico-titulo">
      <div className="historico-topo">
        <h2 id="historico-titulo" className="painel-titulo">
          {t.historico}
        </h2>
        <div className="historico-filtros" role="group" aria-label={t.filtrarHistorico}>
          {FILTROS.map((chave) => (
            <button key={chave} type="button" aria-pressed={filtro === chave} onClick={() => setFiltro(chave)}>
              {t.filtrosHistorico[chave]} ({contar(chave)})
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
                <th scope="col">{t.pessoa}</th>
                <th scope="col">{t.servico}</th>
                <th scope="col">{t.situacao}</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((a) => (
                <tr key={a.id} className={aoAbrir ? "historico-clicavel" : undefined} onClick={aoAbrir ? () => aoAbrir(a.id) : undefined}>
                  <td>
                    <time dateTime={`${a.horario.data}T${a.horario.hora_inicio}`}>
                      <strong>{dataComAno(a.inicio)}</strong>
                      <small>{t.intervalo(a.horario.hora_inicio, a.horario.hora_fim)}</small>
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
        <p className="vol-vazio">{t.historicoVazio}</p>
      )}
    </section>
  );
}
