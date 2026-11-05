import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { ChartColumnStacked } from "lucide-react";
import { localeAtual, useIdioma, useTextos } from "../../context/IdiomaContext";
import { traduzido } from "../../dados/conteudo";
import { DIAS, TURNOS, diasETurnos, mesAtual, pessoasAtendidas, porMes, porServico, taxaDeRealizacao } from "./estatisticas";
import { nomeDoIdioma } from "./usePainel";
import { traducoes } from "./traducoes";
import "./graficos.css";

const porcentagem = (valor) => new Intl.NumberFormat(localeAtual(), { style: "percent", maximumFractionDigits: 0 }).format(valor);

function mesCurto(mes) {
  const nome = new Date(`${mes}-01T00:00:00`).toLocaleDateString(localeAtual(), { month: "short" }).replace(".", "");
  return nome[0].toUpperCase() + nome.slice(1);
}

function Cartao({ id, titulo, className = "", children }) {
  return (
    <section className={`painel-cartao grafico-cartao ${className}`} aria-labelledby={id}>
      <h3 id={id} className="grafico-titulo">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

function Destaque({ valor, texto }) {
  return (
    <p className="grafico-destaque">
      <strong>{valor}</strong> <span>{texto}</span>
    </p>
  );
}

function Vazio({ texto }) {
  return <p className="vol-vazio grafico-vazio">{texto}</p>;
}

// o desenho fica escondido do leitor de tela, que lê esta tabela no lugar.
// A tabela vai dentro de uma div: tabela não encolhe para 1px e alargava a página no celular
function TabelaOculta({ legenda, colunas, linhas }) {
  return (
    <div className="grafico-oculto">
      <table>
        <caption>{legenda}</caption>
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna} scope="col">
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map(([cabeca, ...valores]) => (
            <tr key={cabeca}>
              <th scope="row">{cabeca}</th>
              {valores.map((valor, i) => (
                <td key={i}>{valor}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// o balão segue o mouse; no toque ele abre com o clique e fica até tocar em outra parte
const soMouse = (acao) => (e) => e.pointerType === "mouse" && acao();

// balão com o valor, no hover ou no toque; nas pontas ele encosta na borda para não sair do cartão
function Dica({ titulo, linhas, posicao, total }) {
  const lado = posicao === 0 ? " grafico-dica-inicio" : posicao === total - 1 ? " grafico-dica-fim" : "";
  return (
    <span className={`grafico-dica${lado}`}>
      <strong>{titulo}</strong>
      {linhas.map((linha) => (
        <span key={linha.texto}>
          {linha.classe && <i className={`grafico-traco ${linha.classe}`}></i>}
          {linha.texto}
        </span>
      ))}
    </span>
  );
}

function PorMes({ atendimentos, mes, nomeDoMes }) {
  const g = useTextos(traducoes).graficos;
  const [ativo, setAtivo] = useState(null);
  const meses = porMes(atendimentos, mes || mesAtual());
  const realizados = meses.reduce((soma, m) => soma + m.realizados, 0);
  const maximo = Math.max(1, ...meses.map((m) => m.realizados + m.cancelados));
  const vazio = meses.every((m) => m.realizados + m.cancelados === 0);

  return (
    <Cartao id="grafico-mes-titulo" titulo={g.porMes} className="grafico-cartao-mes">
      <Destaque valor={realizados} texto={g.porMesResumo(realizados)} />
      {vazio ? (
        <Vazio texto={g.vazioMes} />
      ) : (
        <>
          <ul className="grafico-legenda" aria-hidden="true">
            <li>
              <i className="grafico-chave grafico-realizado"></i>
              {g.realizados}
            </li>
            <li>
              <i className="grafico-chave grafico-cancelado"></i>
              {g.cancelados}
            </li>
          </ul>
          <div className="grafico-colunas" aria-hidden="true" onPointerLeave={soMouse(() => setAtivo(null))}>
            {meses.map((m, i) => {
              const total = m.realizados + m.cancelados;
              return (
                <div
                  key={m.mes}
                  className={`grafico-coluna${m.mes === mes ? " grafico-coluna-destaque" : ""}`}
                  onPointerEnter={soMouse(() => setAtivo(i))}
                  onClick={() => setAtivo(i)}
                >
                  <div className="grafico-coluna-area">
                    {total > 0 && (
                      <div className="grafico-pilha" style={{ height: `${(total / maximo) * 100}%` }}>
                        <span className="grafico-pilha-valor">{total}</span>
                        <span className="grafico-pilha-partes">
                          {m.cancelados > 0 && <span className="grafico-cancelado" style={{ flexGrow: m.cancelados }}></span>}
                          {m.realizados > 0 && <span className="grafico-realizado" style={{ flexGrow: m.realizados }}></span>}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="grafico-coluna-mes">{mesCurto(m.mes)}</span>
                  {ativo === i && (
                    <Dica
                      titulo={nomeDoMes(m.mes)}
                      posicao={i}
                      total={meses.length}
                      linhas={[
                        { classe: "grafico-realizado", texto: g.qtdRealizados(m.realizados) },
                        { classe: "grafico-cancelado", texto: g.qtdCancelados(m.cancelados) },
                      ]}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      <TabelaOculta
        legenda={g.porMes}
        colunas={[g.tabela.mes, g.realizados, g.cancelados]}
        linhas={meses.map((m) => [nomeDoMes(m.mes), m.realizados, m.cancelados])}
      />
    </Cartao>
  );
}

function Taxa({ atendimentos }) {
  const g = useTextos(traducoes).graficos;
  const { realizados, cancelados, encerrados, taxa } = taxaDeRealizacao(atendimentos);

  return (
    <Cartao id="grafico-taxa-titulo" titulo={g.taxa} className="grafico-cartao-taxa">
      {taxa === null ? (
        <Vazio texto={g.vazioTaxa} />
      ) : (
        <div className="grafico-taxa">
          <Destaque valor={porcentagem(taxa)} texto={g.taxaResumo(realizados, encerrados)} />
          <div className="grafico-medidor" aria-hidden="true">
            {realizados > 0 && <span className="grafico-realizado" style={{ flexGrow: realizados }}></span>}
            {cancelados > 0 && <span className="grafico-cancelado" style={{ flexGrow: cancelados }}></span>}
          </div>
          <ul className="grafico-legenda">
            <li>
              <i className="grafico-chave grafico-realizado"></i>
              {g.qtdRealizados(realizados)}
            </li>
            <li>
              <i className="grafico-chave grafico-cancelado"></i>
              {g.qtdCancelados(cancelados)}
            </li>
          </ul>
        </div>
      )}
    </Cartao>
  );
}

// barras deitadas, da maior para a menor; o nome e o número ficam escritos em cima de cada barra
function Barras({ itens, nomeOutros }) {
  const maximo = Math.max(1, ...itens.map((i) => i.total));
  return (
    <ul className="grafico-barras">
      {itens.map((item) => (
        <li key={item.chave}>
          <span className="grafico-barra-texto">
            <span>{item.outros ? nomeOutros : item.nome}</span>
            <strong>{item.total}</strong>
          </span>
          <span className="grafico-barra-trilho" aria-hidden="true">
            <span className={`grafico-barra${item.outros ? " grafico-barra-outros" : ""}`} style={{ width: `${(item.total / maximo) * 100}%` }}></span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Servicos({ atendimentos }) {
  const g = useTextos(traducoes).graficos;
  const { idioma } = useIdioma();
  const itens = porServico(atendimentos, (servico) => traduzido(servico, "titulo", idioma));
  const total = itens.reduce((soma, item) => soma + item.total, 0);

  return (
    <Cartao id="grafico-servicos-titulo" titulo={g.servicos}>
      {total ? (
        <>
          <Destaque valor={porcentagem(itens[0].total / total)} texto={g.servicosResumo(itens[0].nome)} />
          <Barras itens={itens} nomeOutros={g.outros} />
          <p className="grafico-nota">{g.servicosNota}</p>
        </>
      ) : (
        <Vazio texto={g.vazioServicos} />
      )}
    </Cartao>
  );
}

function Pessoas({ atendimentos }) {
  const t = useTextos(traducoes);
  const g = t.graficos;
  const { pessoas, paises, porPais, porIdioma } = pessoasAtendidas(atendimentos, t.semNacionalidade);

  return (
    <Cartao id="grafico-pessoas-titulo" titulo={g.pessoas}>
      {pessoas ? (
        <>
          <Destaque valor={pessoas} texto={g.pessoasResumo(pessoas, paises)} />
          <Barras itens={porPais} nomeOutros={g.outrosPaises} />
          <div className="grafico-idiomas">
            <h4>{g.idiomas}</h4>
            <ul>
              {porIdioma.map((i) => (
                <li key={i.codigo}>
                  {nomeDoIdioma(i.codigo)} <strong>{i.total}</strong>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <Vazio texto={g.vazioPessoas} />
      )}
    </Cartao>
  );
}

// 4 tons de azul: quanto mais atendimentos, mais escuro
const nivel = (total, maximo) => (total ? Math.ceil((total / maximo) * 4) : 0);

function DiasETurnos({ atendimentos }) {
  const t = useTextos(traducoes);
  const g = t.graficos;
  const [ativo, setAtivo] = useState(null);
  const { celulas, maximo, topo } = diasETurnos(atendimentos);
  const nomeCelula = (dia, turno) => g.diaETurno(t.diasSemana[dia], turno);

  return (
    <Cartao id="grafico-dias-titulo" titulo={g.diasTurnos}>
      {topo ? (
        <>
          <p className="grafico-destaque grafico-destaque-texto">
            <strong>{nomeCelula(topo.dia, topo.turno)}</strong> <span>{g.diasResumo(topo.total)}</span>
          </p>
          <div className="grafico-calor" aria-hidden="true" onPointerLeave={soMouse(() => setAtivo(null))}>
            <span></span>
            {TURNOS.map((turno) => (
              <span key={turno} className="grafico-calor-turno">
                {g.turnos[turno]}
              </span>
            ))}
            {DIAS.map((dia) => (
              <Fragment key={dia}>
                <span className="grafico-calor-dia">{t.diasSemana[dia].slice(0, 3)}</span>
                {TURNOS.map((turno, j) => {
                  const total = celulas[dia][j];
                  const chave = `${dia}-${turno}`;
                  return (
                    <span
                      key={turno}
                      className={`grafico-calor-celula grafico-nivel-${nivel(total, maximo)}`}
                      onPointerEnter={soMouse(() => setAtivo(chave))}
                      onClick={() => setAtivo(chave)}
                    >
                      {total || ""}
                      {ativo === chave && <Dica titulo={g.dicaCelula(nomeCelula(dia, turno), total)} linhas={[]} posicao={j} total={TURNOS.length} />}
                    </span>
                  );
                })}
              </Fragment>
            ))}
          </div>
          <p className="grafico-escala" aria-hidden="true">
            {g.escala[0]}
            {[1, 2, 3, 4].map((n) => (
              <i key={n} className={`grafico-nivel-${n}`}></i>
            ))}
            {g.escala[1]}
          </p>
          <p className="grafico-nota">{g.servicosNota}</p>
          <TabelaOculta
            legenda={g.diasTurnos}
            colunas={[g.tabela.dia, ...TURNOS.map((turno) => g.turnos[turno])]}
            linhas={DIAS.map((dia) => [t.diasSemana[dia], ...celulas[dia]])}
          />
        </>
      ) : (
        <Vazio texto={g.vazioServicos} />
      )}
    </Cartao>
  );
}

// gráficos do painel; o período é o mesmo dos números lá em cima
export default function Graficos({ painel, mes, aoMudarMes, nomeDoMes }) {
  const t = useTextos(traducoes);
  const g = t.graficos;
  const todos = painel.todos;

  if (!todos.length) {
    return (
      <section className="painel-cartao graficos-vazio" aria-labelledby="graficos-titulo">
        <span className="graficos-vazio-icone">
          <ChartColumnStacked size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 id="graficos-titulo" className="painel-titulo">
            {g.vazioTitulo}
          </h2>
          <p>{g.vazioTexto}</p>
        </div>
        <Link to="/voluntario/perfil?aba=agenda">{t.abrirHorarios}</Link>
      </section>
    );
  }

  const doPeriodo = todos.filter((a) => !mes || a.horario.data.startsWith(mes));
  // serviços e horários contam o que aconteceu e o que está marcado; quem foi atendido, só os realizados
  const semCancelados = doPeriodo.filter((a) => a.status !== "cancelado");
  const realizados = doPeriodo.filter((a) => a.status === "realizado");

  return (
    <section className="graficos" aria-labelledby="graficos-titulo">
      <div className="painel-cartao-topo">
        <h2 id="graficos-titulo" className="painel-titulo">
          {g.titulo}
        </h2>
        <div className="campo painel-periodo">
          <label htmlFor="graficos-mes">{t.periodo}</label>
          <select id="graficos-mes" value={mes} onChange={(e) => aoMudarMes(e.target.value)}>
            <option value="">{t.todosMeses}</option>
            {painel.meses.map((m) => (
              <option key={m} value={m}>
                {nomeDoMes(m)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="graficos-grade">
        <PorMes atendimentos={todos} mes={mes} nomeDoMes={nomeDoMes} />
        <Taxa atendimentos={doPeriodo} />
        <Servicos atendimentos={semCancelados} />
        <Pessoas atendimentos={realizados} />
        <DiasETurnos atendimentos={semCancelados} />
      </div>
    </section>
  );
}
