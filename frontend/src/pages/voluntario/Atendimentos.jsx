import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Historico from "./Historico";
import DetalheAtendimento from "./DetalheAtendimento";
import { Aguardando, CancelarAtendimento, ConcluirAtendimento, Pessoa, diaExtenso, quando } from "./comum";
import { useTextos } from "../../context/IdiomaContext";
import { traducoes } from "./traducoes";

function ItemAtendimento({ atendimento, cancelar, marcarRealizado }) {
  const [aberto, setAberto] = useState(false);
  const t = useTextos(traducoes);
  const idCaso = `caso-${atendimento.id}`;

  return (
    <li className="atend-item">
      <div className="atend-resumo">
        <div className="atend-quando">
          <span className="vol-quando">{quando(atendimento.inicio)}</span>
          <time dateTime={`${atendimento.horario.data}T${atendimento.horario.hora_inicio}`}>
            {diaExtenso(atendimento.inicio)}, {t.intervalo(atendimento.horario.hora_inicio, atendimento.horario.hora_fim)}
          </time>
        </div>
        <Pessoa usuario={atendimento.usuario} />
        <span className="vol-servico">{atendimento.servico.titulo}</span>
        <button type="button" className="vol-botao-secundario" aria-expanded={aberto} aria-controls={idCaso} onClick={() => setAberto(!aberto)}>
          {aberto ? t.fechar : t.verCaso}
        </button>
      </div>
      {aberto && (
        <div className="atend-detalhe" id={idCaso}>
          <blockquote className="vol-caso">
            <p>{atendimento.descricao}</p>
          </blockquote>
          <div className="vol-acoes vol-proximo-acoes">
            <ConcluirAtendimento id={atendimento.id} marcarRealizado={marcarRealizado} />
            <CancelarAtendimento id={atendimento.id} cancelar={cancelar} />
          </div>
        </div>
      )}
    </li>
  );
}

export default function Atendimentos() {
  const painel = useOutletContext();
  const [abertoId, setAbertoId] = useState(null);
  const t = useTextos(traducoes);

  return (
    <>
      <header className="painel-cabecalho">
        <h1>{t.atendimentosTitulo}</h1>
        <p>{t.atendimentosSubtitulo}</p>
      </header>

      <Aguardando itens={painel.aguardando} marcarRealizado={painel.marcarRealizado} cancelar={painel.cancelar} />

      <section className="painel-cartao" aria-labelledby="atend-proximos-titulo">
        <h2 id="atend-proximos-titulo" className="painel-titulo">
          {t.proximosN(painel.futuros.length)}
        </h2>
        {painel.futuros.length ? (
          <ul className="atend-lista">
            {painel.futuros.map((a) => (
              <ItemAtendimento key={a.id} atendimento={a} cancelar={painel.cancelar} marcarRealizado={painel.marcarRealizado} />
            ))}
          </ul>
        ) : (
          <p className="vol-vazio">{t.nenhumMarcado}</p>
        )}
      </section>

      <Historico passados={painel.passados} aoAbrir={setAbertoId} />

      <DetalheAtendimento atendimento={painel.todos.find((a) => a.id === abertoId) ?? null} aoFechar={() => setAbertoId(null)} painel={painel} />
    </>
  );
}
