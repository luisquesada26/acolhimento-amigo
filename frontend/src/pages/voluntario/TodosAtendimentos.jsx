import { useState } from "react";
import { OrdenarPorData, Status, Svg, dataComAno } from "./comum";
import { localeAtual, useIdioma, useTextos } from "../../context/IdiomaContext";
import { traduzido } from "../../dados/conteudo";
import { chaveDoPais, nomeDoPais } from "../../dados/paises";
import { exportarExcel, prepararExcel } from "./exportarExcel";
import { traducoes } from "./traducoes";

// o nome de cada pílula vem das traduções (filtrosHistorico); "confirmado" são os agendados
const SITUACOES = ["todos", "realizado", "confirmado", "cancelado"];
const SEM_FILTRO = { busca: "", de: "", ate: "", servico: "", pais: "" };

// busca sem diferenciar maiúscula nem acento ("maria" acha "María")
const normalizar = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// cada serviço vira uma opção pelo título original (o valor do filtro), com o nome no idioma da bandeira
function servicosDe(atendimentos, idioma) {
  const porTitulo = new Map();
  for (const a of atendimentos) {
    if (!porTitulo.has(a.servico.titulo)) porTitulo.set(a.servico.titulo, traduzido(a.servico, "titulo", idioma));
  }
  return [...porTitulo].map(([valor, nome]) => ({ valor, nome })).sort((a, b) => a.nome.localeCompare(b.nome, localeAtual()));
}

// o mesmo país escrito de jeitos diferentes ("Colômbia", "colombia") vira uma opção só,
// com o nome no idioma da bandeira; o valor da opção é a chave do país
function paisesDe(atendimentos) {
  const porChave = new Map();
  for (const a of atendimentos) {
    const texto = a.usuario.pais_origem;
    if (texto?.trim() && !porChave.has(chaveDoPais(texto))) porChave.set(chaveDoPais(texto), nomeDoPais(texto).trim());
  }
  return [...porChave].map(([chave, nome]) => ({ chave, nome })).sort((a, b) => a.nome.localeCompare(b.nome, localeAtual()));
}

// todos os atendimentos em tabela: pílula da situação, filtros, contador e a planilha do que está na tela.
// Clicar na linha abre o atendimento
export default function TodosAtendimentos({ atendimentos, aoAbrir }) {
  const [situacao, setSituacao] = useState("todos");
  const [filtros, setFiltros] = useState(SEM_FILTRO);
  const [ordem, setOrdem] = useState("desc");
  const [exportando, setExportando] = useState(false);
  const [erroExportar, setErroExportar] = useState(false);
  const t = useTextos(traducoes);
  const { idioma } = useIdioma();

  const servicos = servicosDe(atendimentos, idioma);
  const paises = paisesDe(atendimentos);
  const busca = normalizar(filtros.busca.trim());

  // as contagens das pílulas já respeitam os filtros
  const nosFiltros = atendimentos
    .filter(
      (a) =>
        (!busca || normalizar(a.usuario.nome).includes(busca)) &&
        (!filtros.de || a.horario.data >= filtros.de) &&
        (!filtros.ate || a.horario.data <= filtros.ate) &&
        (!filtros.servico || a.servico.titulo === filtros.servico) &&
        (!filtros.pais || chaveDoPais(a.usuario.pais_origem) === filtros.pais)
    )
    .sort((a, b) => (ordem === "desc" ? b.inicio - a.inicio : a.inicio - b.inicio));
  const itens = situacao === "todos" ? nosFiltros : nosFiltros.filter((a) => a.status === situacao);
  const contar = (chave) => (chave === "todos" ? nosFiltros.length : nosFiltros.filter((a) => a.status === chave).length);
  const pessoas = new Set(itens.map((a) => a.usuario.id)).size;
  const temFiltro = Object.values(filtros).some(Boolean);

  const mudar = (campo) => (e) => setFiltros((atual) => ({ ...atual, [campo]: e.target.value }));

  async function exportar() {
    setExportando(true);
    setErroExportar(false);
    try {
      await exportarExcel(itens, t, idioma);
    } catch {
      setErroExportar(true);
    } finally {
      setExportando(false);
    }
  }

  return (
    <section className="painel-cartao" aria-labelledby="todos-atend-titulo">
      <div className="historico-topo">
        <h2 id="todos-atend-titulo" className="painel-titulo">
          {t.todosAtendimentos}
        </h2>
        <div className="historico-filtros" role="group" aria-label={t.filtrarSituacao}>
          {SITUACOES.map((chave) => (
            <button key={chave} type="button" aria-pressed={situacao === chave} onClick={() => setSituacao(chave)}>
              {t.filtrosHistorico[chave]} ({contar(chave)})
            </button>
          ))}
        </div>
      </div>

      <div className="atend-filtros" role="group" aria-label={t.filtros}>
        <div className="campo atend-busca">
          <label htmlFor="atend-busca">{t.buscarPessoa}</label>
          <div className="atend-busca-campo">
            <Svg nome="busca" tamanho={18} />
            <input id="atend-busca" type="search" value={filtros.busca} onChange={mudar("busca")} placeholder={t.nomePessoa} />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="atend-de">{t.de}</label>
          <input id="atend-de" type="date" value={filtros.de} max={filtros.ate || undefined} onChange={mudar("de")} />
        </div>
        <div className="campo">
          <label htmlFor="atend-ate">{t.ate}</label>
          <input id="atend-ate" type="date" value={filtros.ate} min={filtros.de || undefined} onChange={mudar("ate")} />
        </div>
        <div className="campo">
          <label htmlFor="atend-servico">{t.servico}</label>
          <select id="atend-servico" value={filtros.servico} onChange={mudar("servico")}>
            <option value="">{t.todos}</option>
            {servicos.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="atend-pais">{t.nacionalidade}</label>
          <select id="atend-pais" value={filtros.pais} onChange={mudar("pais")}>
            <option value="">{t.todas}</option>
            {paises.map((p) => (
              <option key={p.chave} value={p.chave}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="atend-resultado">
        <p className="atend-contador" aria-live="polite">
          {t.resultado(itens.length, pessoas)}
        </p>
        <div className="atend-resultado-acoes">
          {temFiltro && (
            <button type="button" className="vol-botao-secundario" onClick={() => setFiltros(SEM_FILTRO)}>
              {t.limparFiltros}
            </button>
          )}
          <button
            type="button"
            className="vol-botao-secundario atend-exportar"
            onClick={exportar}
            onPointerEnter={prepararExcel}
            onFocus={prepararExcel}
            disabled={exportando || !itens.length}
            aria-busy={exportando}
          >
            <Svg nome="baixar" tamanho={18} /> {exportando ? t.exportando : t.exportarExcel}
          </button>
        </div>
        {erroExportar && (
          <p className="vol-erro" role="alert">
            {t.erroExportar}
          </p>
        )}
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
                <tr key={a.id} className="historico-clicavel" onClick={() => aoAbrir(a.id)}>
                  <td>
                    <time dateTime={`${a.horario.data}T${a.horario.hora_inicio}`}>
                      <strong>{dataComAno(a.inicio)}</strong>
                      <small>{t.intervalo(a.horario.hora_inicio, a.horario.hora_fim)}</small>
                    </time>
                  </td>
                  <td>
                    <button type="button" className="historico-abrir" onClick={(e) => (e.stopPropagation(), aoAbrir(a.id))}>
                      {a.usuario.nome}
                    </button>
                    <small>{nomeDoPais(a.usuario.pais_origem)}</small>
                  </td>
                  <td>{traduzido(a.servico, "titulo", idioma)}</td>
                  <td>
                    <Status status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="vol-vazio">{!atendimentos.length ? t.atendimentosVazio : temFiltro ? t.ninguemEncontrado : t.nadaNaSituacao}</p>
      )}
    </section>
  );
}
