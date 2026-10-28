import { useState } from "react";
import { Interruptor, Janela, Svg, useAcao } from "./comum";
import { useTextos } from "../../context/IdiomaContext";
import { traducoes } from "./traducoes";

const DURACOES = [30, 45, 60, 90];

function FormServico({ id, inicial, aoSalvar, aoCancelar, rotulo }) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [duracao, setDuracao] = useState(String(inicial?.duracao_min ?? 45));
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const t = useTextos(traducoes);

  async function enviar(evento) {
    evento.preventDefault();
    if (titulo.trim().length < 3) return setErro(t.erroTitulo);
    if (descricao.trim().length < 10) return setErro(t.erroDescricao);

    setEnviando(true);
    setErro("");
    const mensagem = await aoSalvar({ titulo: titulo.trim(), descricao: descricao.trim(), duracao_min: Number(duracao) });
    setEnviando(false);
    if (mensagem) setErro(mensagem);
  }

  return (
    <form className="servico-form" onSubmit={enviar} noValidate>
      <div className="campo">
        <label htmlFor={`${id}-titulo`}>{t.tituloCampo}</label>
        <input id={`${id}-titulo`} value={titulo} maxLength={80} onChange={(e) => setTitulo(e.target.value)} placeholder={t.exTitulo} />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-descricao`}>{t.descricao}</label>
        <textarea
          id={`${id}-descricao`}
          rows={3}
          maxLength={500}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder={t.descricaoPlaceholder}
        />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-duracao`}>{t.duracao}</label>
        <select id={`${id}-duracao`} value={duracao} onChange={(e) => setDuracao(e.target.value)}>
          {DURACOES.map((d) => (
            <option key={d} value={d}>
              {t.minutos(d)}
            </option>
          ))}
        </select>
      </div>
      {erro && (
        <p className="vol-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="vol-acoes">
        <button type="submit" className="botao botao-primario botao-voluntario vol-botao-pequeno" disabled={enviando}>
          {enviando ? t.salvando : rotulo}
        </button>
        <button type="button" className="vol-botao-secundario" onClick={aoCancelar} disabled={enviando}>
          {t.cancelar}
        </button>
      </div>
    </form>
  );
}

function CartaoServico({ servico, editarServico, excluirServico }) {
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState("");
  const t = useTextos(traducoes);
  const ativar = useAcao(() => editarServico(servico.id, { ativo: !servico.ativo }));
  const excluir = useAcao(async () => {
    const { erro, desativado } = await excluirServico(servico.id);
    if (desativado) setAviso(t.jaTeveAtendimentos);
    setConfirmando(false);
    return erro;
  });

  if (editando) {
    return (
      <li className="servico-cartao">
        <FormServico
          id={`servico-${servico.id}`}
          inicial={servico}
          rotulo={t.salvar}
          aoCancelar={() => setEditando(false)}
          aoSalvar={async (campos) => {
            const erro = await editarServico(servico.id, campos);
            if (!erro) setEditando(false);
            return erro;
          }}
        />
      </li>
    );
  }

  return (
    <li className={servico.ativo ? "servico-cartao" : "servico-cartao servico-inativo"}>
      <div className="servico-topo">
        <h2>{servico.titulo}</h2>
        <div className="servico-icones">
          <button type="button" className="pagina-icone" onClick={() => setEditando(true)} aria-label={t.editarNome(servico.titulo)} title={t.editar}>
            <Svg nome="editar" tamanho={18} />
          </button>
          <button type="button" className="pagina-icone" onClick={() => setConfirmando(true)} aria-label={t.excluirNome(servico.titulo)} title={t.excluir}>
            <Svg nome="lixo" tamanho={18} />
          </button>
        </div>
      </div>
      <p>{servico.descricao}</p>
      <div className="servico-rodape">
        <span className="servico-duracao">
          <Svg nome="relogio" tamanho={16} /> {servico.duracao_min} min
        </span>
        <Interruptor ligado={servico.ativo} aoMudar={ativar.executar} desabilitado={ativar.ocupado} rotulo={servico.ativo ? t.ativo : t.inativo} />
      </div>
      {confirmando && (
        <div className="vol-confirmar">
          <span>{t.excluirEsteServico}</span>
          <div className="vol-acoes">
            <button type="button" className="vol-botao-perigo vol-botao-cheio" onClick={excluir.executar} disabled={excluir.ocupado}>
              {excluir.ocupado ? t.excluindo : t.simExcluir}
            </button>
            <button type="button" className="vol-botao-secundario" onClick={() => setConfirmando(false)} disabled={excluir.ocupado}>
              {t.nao}
            </button>
          </div>
        </div>
      )}
      {aviso && (
        <p className="dica" role="status">
          {aviso}
        </p>
      )}
      {(ativar.erro || excluir.erro) && (
        <p className="vol-erro" role="alert">
          {ativar.erro || excluir.erro}
        </p>
      )}
    </li>
  );
}

// criar, editar, ativar e excluir serviços (aba Serviços do Meu perfil)
export function GerenciarServicos({ painel }) {
  const [criando, setCriando] = useState(false);
  const t = useTextos(traducoes);

  return (
    <section className="servicos-bloco" aria-labelledby="servicos-bloco-titulo">
      <div className="painel-cartao-topo">
        <h2 id="servicos-bloco-titulo" className="painel-titulo">
          {t.seusServicos}
        </h2>
        <button type="button" className="botao botao-primario botao-voluntario vol-botao-pequeno" onClick={() => setCriando(true)}>
          <Svg nome="mais" tamanho={18} /> {t.novoServico}
        </button>
      </div>

      <Janela aberta={criando} titulo={t.novoServico} aoFechar={() => setCriando(false)}>
        <FormServico
          id="novo-servico"
          rotulo={t.criarServico}
          aoCancelar={() => setCriando(false)}
          aoSalvar={async (campos) => {
            const erro = await painel.criarServico(campos);
            if (!erro) setCriando(false);
            return erro;
          }}
        />
      </Janela>

      {painel.servicos.length ? (
        <ul className="servico-grade">
          {painel.servicos.map((s) => (
            <CartaoServico key={s.id} servico={s} editarServico={painel.editarServico} excluirServico={painel.excluirServico} />
          ))}
        </ul>
      ) : (
        <p className="vol-vazio">{t.semServicos}</p>
      )}
    </section>
  );
}
