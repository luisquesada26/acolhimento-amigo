import { useState } from "react";
import { Interruptor, Janela, Svg, useAcao } from "./comum";

const DURACOES = [30, 45, 60, 90];

function FormServico({ id, inicial, aoSalvar, aoCancelar, rotulo }) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [duracao, setDuracao] = useState(String(inicial?.duracao_min ?? 45));
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    if (titulo.trim().length < 3) return setErro("O título precisa ter pelo menos 3 caracteres.");
    if (descricao.trim().length < 10) return setErro("A descrição precisa ter pelo menos 10 caracteres.");

    setEnviando(true);
    setErro("");
    const mensagem = await aoSalvar({ titulo: titulo.trim(), descricao: descricao.trim(), duracao_min: Number(duracao) });
    setEnviando(false);
    if (mensagem) setErro(mensagem);
  }

  return (
    <form className="servico-form" onSubmit={enviar} noValidate>
      <div className="campo">
        <label htmlFor={`${id}-titulo`}>Título</label>
        <input id={`${id}-titulo`} value={titulo} maxLength={80} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Protocolo de refúgio" />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-descricao`}>Descrição</label>
        <textarea
          id={`${id}-descricao`}
          rows={3}
          maxLength={500}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="O que a pessoa vai conseguir resolver com você."
        />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-duracao`}>Duração</label>
        <select id={`${id}-duracao`} value={duracao} onChange={(e) => setDuracao(e.target.value)}>
          {DURACOES.map((d) => (
            <option key={d} value={d}>
              {d} minutos
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
          {enviando ? "Salvando..." : rotulo}
        </button>
        <button type="button" className="vol-botao-secundario" onClick={aoCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function CartaoServico({ servico, editarServico, excluirServico }) {
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState("");
  const ativar = useAcao(() => editarServico(servico.id, { ativo: !servico.ativo }));
  const excluir = useAcao(async () => {
    const { erro, desativado } = await excluirServico(servico.id);
    if (desativado) setAviso("Este serviço já teve atendimentos, então não foi apagado: ficou inativo e saiu da busca.");
    setConfirmando(false);
    return erro;
  });

  if (editando) {
    return (
      <li className="servico-cartao">
        <FormServico
          id={`servico-${servico.id}`}
          inicial={servico}
          rotulo="Salvar"
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
          <button type="button" className="pagina-icone" onClick={() => setEditando(true)} aria-label={`Editar ${servico.titulo}`} title="Editar">
            <Svg nome="editar" tamanho={18} />
          </button>
          <button type="button" className="pagina-icone" onClick={() => setConfirmando(true)} aria-label={`Excluir ${servico.titulo}`} title="Excluir">
            <Svg nome="lixo" tamanho={18} />
          </button>
        </div>
      </div>
      <p>{servico.descricao}</p>
      <div className="servico-rodape">
        <span className="servico-duracao">
          <Svg nome="relogio" tamanho={16} /> {servico.duracao_min} min
        </span>
        <Interruptor ligado={servico.ativo} aoMudar={ativar.executar} desabilitado={ativar.ocupado} rotulo={servico.ativo ? "Ativo" : "Inativo"} />
      </div>
      {confirmando && (
        <div className="vol-confirmar">
          <span>Excluir este serviço?</span>
          <div className="vol-acoes">
            <button type="button" className="vol-botao-perigo vol-botao-cheio" onClick={excluir.executar} disabled={excluir.ocupado}>
              {excluir.ocupado ? "Excluindo..." : "Sim, excluir"}
            </button>
            <button type="button" className="vol-botao-secundario" onClick={() => setConfirmando(false)} disabled={excluir.ocupado}>
              Não
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

  return (
    <section className="servicos-bloco" aria-labelledby="servicos-bloco-titulo">
      <div className="painel-cartao-topo">
        <h2 id="servicos-bloco-titulo" className="painel-titulo">
          Seus serviços
        </h2>
        <button type="button" className="botao botao-primario botao-voluntario vol-botao-pequeno" onClick={() => setCriando(true)}>
          <Svg nome="mais" tamanho={18} /> Novo serviço
        </button>
      </div>

      <Janela aberta={criando} titulo="Novo serviço" aoFechar={() => setCriando(false)}>
        <FormServico
          id="novo-servico"
          rotulo="Criar serviço"
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
        <p className="vol-vazio">Você ainda não tem serviços. Sem pelo menos um serviço ativo, seu perfil não aparece na busca.</p>
      )}
    </section>
  );
}
