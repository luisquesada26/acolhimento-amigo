import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Historico from "./Historico";
import DetalheAtendimento from "./DetalheAtendimento";
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
  const nome = new Date(`${mes}-01T00:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return nome[0].toUpperCase() + nome.slice(1);
}

export default function PainelVoluntario() {
  const painel = useOutletContext();
  const [mes, setMes] = useState("");
  const [abertoId, setAbertoId] = useState(null);

  return (
    <>
      <header className="painel-cabecalho">
        <h1>Que bom ter você de volta, {primeiroNome(painel.perfil.nome)}!</h1>
        <p>{hojeExtenso()}</p>
      </header>

      {!painel.perfilCompleto && <Pendencias pendencias={painel.pendencias} />}

      <section className="painel-numeros" aria-labelledby="numeros-titulo">
        <div className="painel-cartao-topo">
          <h2 id="numeros-titulo" className="painel-titulo">
            {mes ? `Seus números em ${nomeDoMes(mes).toLowerCase()}` : "Seus números"}
          </h2>
          <div className="campo painel-periodo">
            <label htmlFor="painel-mes">Período</label>
            <select id="painel-mes" value={mes} onChange={(e) => setMes(e.target.value)}>
              <option value="">Todos os meses</option>
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
                Próximos atendimentos ({painel.futuros.length})
              </h2>
              <Link to="/voluntario/atendimentos">Ver todos</Link>
            </div>
            <ListaAtendimentos itens={painel.futuros} vazio="Nenhum atendimento marcado por enquanto." aoAbrir={setAbertoId} />
          </section>
        </div>

        <div className="painel-lateral">
          <section className="painel-cartao" aria-labelledby="livres-titulo">
            <div className="painel-cartao-topo">
              <h2 id="livres-titulo" className="painel-titulo">
                Horários livres
              </h2>
              <Link to="/voluntario/perfil?aba=agenda">Abrir horários</Link>
            </div>
            <HorariosLivres horarios={painel.horariosLivres} />
          </section>

          <section className="painel-cartao" aria-labelledby="servicos-titulo">
            <div className="painel-cartao-topo">
              <h2 id="servicos-titulo" className="painel-titulo">
                Seus serviços
              </h2>
              <Link to="/voluntario/perfil?aba=servicos">Gerenciar</Link>
            </div>
            {painel.servicos.length ? (
              <ul className="painel-servicos">
                {painel.servicos.map((s) => (
                  <li key={s.id}>
                    <strong>{s.titulo}</strong>
                    <span>
                      {s.duracao_min} min · {s.ativo ? "ativo" : "inativo"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="vol-vazio">Você ainda não cadastrou serviços.</p>
            )}
          </section>
        </div>
      </div>

      <Historico passados={painel.passados} aoAbrir={setAbertoId} />

      <DetalheAtendimento atendimento={painel.todos.find((a) => a.id === abertoId) ?? null} aoFechar={() => setAbertoId(null)} painel={painel} />
    </>
  );
}
