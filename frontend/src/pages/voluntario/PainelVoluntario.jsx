import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Historico from "./Historico";
import DetalheAtendimento from "./DetalheAtendimento";
import { localeAtual, useTextos } from "../../context/IdiomaContext";
import { traducoes } from "./traducoes";
import {
  Aguardando,
  HorariosLivres,
  ListaAtendimentos,
  Numeros,
  Pendencias,
  ProximoAtendimento,
  hojeExtenso,
  primeiroNome,
} from "./comum";

function nomeDoMes(mes) {
  const nome = new Date(`${mes}-01T00:00:00`).toLocaleDateString(localeAtual(), { month: "long", year: "numeric" });
  return nome[0].toUpperCase() + nome.slice(1);
}

export default function PainelVoluntario() {
  const painel = useOutletContext();
  const [mes, setMes] = useState("");
  const [abertoId, setAbertoId] = useState(null);
  const t = useTextos(traducoes);

  return (
    <>
      <header className="painel-cabecalho">
        <h1>{t.boasVindas(primeiroNome(painel.perfil.nome))}</h1>
        <p>{hojeExtenso()}</p>
      </header>

      {!painel.perfilCompleto && <Pendencias pendencias={painel.pendencias} />}

      <section className="painel-numeros" aria-labelledby="numeros-titulo">
        <div className="painel-cartao-topo">
          <h2 id="numeros-titulo" className="painel-titulo">
            {mes ? t.numerosEm(nomeDoMes(mes)) : t.seusNumeros}
          </h2>
          <div className="campo painel-periodo">
            <label htmlFor="painel-mes">{t.periodo}</label>
            <select id="painel-mes" value={mes} onChange={(e) => setMes(e.target.value)}>
              <option value="">{t.todosMeses}</option>
              {painel.meses.map((m) => (
                <option key={m} value={m}>
                  {nomeDoMes(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Numeros numeros={painel.numerosDoPeriodo(mes)} />
      </section>

      <Aguardando itens={painel.aguardando} marcarRealizado={painel.marcarRealizado} cancelar={painel.cancelar} />

      <div className="painel-colunas">
        <div className="painel-principal">
          <ProximoAtendimento atendimento={painel.proximo} cancelar={painel.cancelar} marcarRealizado={painel.marcarRealizado} />

          <section className="painel-cartao" aria-labelledby="proximos-titulo">
            <div className="painel-cartao-topo">
              <h2 id="proximos-titulo" className="painel-titulo">
                {t.proximosAtendimentos(painel.futuros.length)}
              </h2>
              <Link to="/voluntario/atendimentos">{t.verTodos}</Link>
            </div>
            <ListaAtendimentos itens={painel.futuros} vazio={t.nenhumMarcadoCurto} aoAbrir={setAbertoId} />
          </section>
        </div>

        <div className="painel-lateral">
          <section className="painel-cartao" aria-labelledby="livres-titulo">
            <div className="painel-cartao-topo">
              <h2 id="livres-titulo" className="painel-titulo">
                {t.numeros.livres}
              </h2>
              <Link to="/voluntario/perfil?aba=agenda">{t.abrirHorarios}</Link>
            </div>
            <HorariosLivres horarios={painel.horariosLivres} />
          </section>

          <section className="painel-cartao" aria-labelledby="servicos-titulo">
            <div className="painel-cartao-topo">
              <h2 id="servicos-titulo" className="painel-titulo">
                {t.seusServicos}
              </h2>
              <Link to="/voluntario/perfil?aba=servicos">{t.gerenciar}</Link>
            </div>
            {painel.servicos.length ? (
              <ul className="painel-servicos">
                {painel.servicos.map((s) => (
                  <li key={s.id}>
                    <strong>{s.titulo}</strong>
                    <span>
                      {s.duracao_min} min · {s.ativo ? t.servicoAtivo : t.servicoInativo}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="vol-vazio">{t.semServicosCadastrados}</p>
            )}
          </section>
        </div>
      </div>

      <Historico passados={painel.passados} aoAbrir={setAbertoId} />

      <DetalheAtendimento atendimento={painel.todos.find((a) => a.id === abertoId) ?? null} aoFechar={() => setAbertoId(null)} painel={painel} />
    </>
  );
}
