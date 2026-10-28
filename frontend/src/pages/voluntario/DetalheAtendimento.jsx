import { useEffect, useRef, useState } from "react";
import { CancelarAtendimento, ConcluirAtendimento, Pessoa, Status, Svg, diaExtenso } from "./comum";
import { useTextos } from "../../context/IdiomaContext";
import { traducoes } from "./traducoes";

const maiuscula = (texto) => texto[0].toUpperCase() + texto.slice(1);

// o que o voluntário registrou: o que foi feito, o que recomendou e o próximo passo
function Anotacao({ atendimento, salvarAnotacao }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(atendimento.anotacao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const t = useTextos(traducoes);

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    const mensagem = await salvarAnotacao(atendimento.id, texto);
    setSalvando(false);
    if (mensagem) setErro(mensagem);
    else setEditando(false);
  }

  if (!editando) {
    return (
      <section className="detalhe-anotacao" aria-labelledby="detalhe-anotacao-titulo">
        <div className="detalhe-anotacao-topo">
          <h3 id="detalhe-anotacao-titulo">{t.suaAnotacao}</h3>
          <button
            type="button"
            className="pagina-icone"
            aria-label={t.editarAnotacao}
            title={t.editar}
            onClick={() => {
              setTexto(atendimento.anotacao ?? "");
              setEditando(true);
            }}
          >
            <Svg nome="editar" tamanho={18} />
          </button>
        </div>
        {atendimento.anotacao ? (
          <p>{atendimento.anotacao}</p>
        ) : (
          <p className="detalhe-anotacao-vazia">{t.semAnotacao}</p>
        )}
      </section>
    );
  }

  return (
    <form className="detalhe-anotacao" onSubmit={salvar} noValidate>
      <label htmlFor="detalhe-anotacao-texto">{t.suaAnotacao}</label>
      <textarea
        id="detalhe-anotacao-texto"
        rows={4}
        maxLength={1000}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={t.anotacaoPlaceholder}
      />
      <div className="vol-acoes">
        <button type="submit" className="botao botao-primario botao-voluntario vol-botao-pequeno" disabled={salvando}>
          {salvando ? t.salvando : t.salvarAnotacao}
        </button>
        <button type="button" className="vol-botao-secundario" onClick={() => setEditando(false)} disabled={salvando}>
          {t.cancelar}
        </button>
      </div>
      {erro && (
        <p className="vol-erro" role="alert">
          {erro}
        </p>
      )}
    </form>
  );
}

// janela com tudo do atendimento; o <dialog> já cuida do Esc e do foco
export default function DetalheAtendimento({ atendimento, aoFechar, painel }) {
  const janela = useRef(null);
  const t = useTextos(traducoes);

  useEffect(() => {
    const dialogo = janela.current;
    if (atendimento && !dialogo.open) dialogo.showModal();
    if (!atendimento && dialogo.open) dialogo.close();
  }, [atendimento]);

  return (
    <dialog
      ref={janela}
      className="agenda-janela detalhe-janela"
      aria-labelledby="detalhe-titulo"
      onClose={aoFechar}
      onClick={(e) => e.target === janela.current && aoFechar()}
    >
      {atendimento && (
        <div className="agenda-janela-conteudo">
          <div className="agenda-janela-topo">
            <Status status={atendimento.status} />
            <button type="button" className="pagina-icone" onClick={aoFechar} aria-label={t.fechar}>
              <Svg nome="x" />
            </button>
          </div>
          <h2 id="detalhe-titulo">{maiuscula(diaExtenso(atendimento.inicio))}</h2>
          <p className="agenda-janela-hora">
            {t.das(atendimento.horario.hora_inicio, atendimento.horario.hora_fim)}
          </p>
          <Pessoa usuario={atendimento.usuario} />
          <p className="vol-servico">{atendimento.servico.titulo}</p>

          <h3 className="detalhe-subtitulo">{t.oQueContou}</h3>
          <blockquote className="vol-caso">
            <p>{atendimento.descricao}</p>
          </blockquote>

          {atendimento.status === "realizado" && <Anotacao atendimento={atendimento} salvarAnotacao={painel.salvarAnotacao} />}

          {atendimento.status === "confirmado" && (
            <div className="vol-acoes vol-proximo-acoes">
              <ConcluirAtendimento id={atendimento.id} marcarRealizado={painel.marcarRealizado} />
              <CancelarAtendimento id={atendimento.id} cancelar={painel.cancelar} />
            </div>
          )}

          {atendimento.status === "cancelado" && <p className="dica">{t.foiCancelado}</p>}
        </div>
      )}
    </dialog>
  );
}
