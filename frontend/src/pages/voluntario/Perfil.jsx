import { useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { nomeDoIdioma } from "./usePainel";
import { Interruptor, Svg, useAcao } from "./comum";
import Avatar, { reduzirFoto } from "../../components/Avatar";
import { GerenciarServicos } from "./Servicos";
import Horarios from "./Horarios";
import { useIdioma, useTextos } from "../../context/IdiomaContext";
import { nomeDaArea } from "../../dados/areas";
import { traducoes } from "./traducoes";

const IDIOMAS = ["pt", "en", "es", "fr"];
// o nome de cada aba vem das traduções (abas)
const ABAS = ["dados", "servicos", "agenda"];

// dado que não muda pelo perfil (área de atuação)
function CampoFixo({ icone, rotulo, valor }) {
  return (
    <div className="perfil-campo">
      <div className="perfil-campo-topo">
        <span className="perfil-campo-icone" aria-hidden="true">
          <Svg nome={icone} tamanho={18} />
        </span>
        <span className="perfil-campo-rotulo">{rotulo}</span>
      </div>
      <div className="perfil-campo-valor">{valor}</div>
    </div>
  );
}

// mostra o valor e vira formulário no lápis; "plano" é sem cartão próprio, para ficar dentro de um bloco
function CampoEditavel({ id, icone, rotulo, mostrar, inicial, aoSalvar, editor, largo = false, plano = false, vazio }) {
  const t = useTextos(traducoes);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(inicial);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    const mensagem = await aoSalvar(valor);
    setSalvando(false);
    if (mensagem) setErro(mensagem);
    else setEditando(false);
  }

  const topo = (
    <div className="perfil-campo-topo">
      <span className="perfil-campo-icone" aria-hidden="true">
        <Svg nome={icone} tamanho={18} />
      </span>
      <span className="perfil-campo-rotulo" id={`${id}-rotulo`}>
        {rotulo}
      </span>
      {!editando && (
        <button
          type="button"
          className="pagina-icone"
          onClick={() => {
            setValor(inicial);
            setEditando(true);
          }}
          aria-label={t.editarCampo(rotulo)}
          title={t.editar}
        >
          <Svg nome="editar" tamanho={18} />
        </button>
      )}
    </div>
  );

  const classe = `perfil-campo${largo ? " perfil-campo-largo" : ""}${plano ? " perfil-campo-plano" : ""}${editando ? " perfil-campo-editando" : ""}`;

  if (!editando) {
    return (
      <div className={classe}>
        {topo}
        <div className="perfil-campo-valor">{mostrar || <em>{vazio ?? t.naoInformado}</em>}</div>
      </div>
    );
  }

  return (
    <form className={classe} onSubmit={salvar} noValidate>
      {topo}
      <div className="perfil-campo-editor">{editor(valor, setValor, id)}</div>
      <div className="vol-acoes">
        <button type="submit" className="botao botao-primario botao-voluntario vol-botao-pequeno" disabled={salvando}>
          {salvando ? t.salvando : t.salvar}
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

function ChipsIdiomas({ valor, setValor, id }) {
  const alternar = (codigo) => setValor(valor.includes(codigo) ? valor.filter((i) => i !== codigo) : [...valor, codigo]);
  return (
    <div className="perfil-chips" role="group" aria-labelledby={`${id}-rotulo`}>
      {IDIOMAS.map((codigo) => (
        <button key={codigo} type="button" aria-pressed={valor.includes(codigo)} onClick={() => alternar(codigo)}>
          {valor.includes(codigo) && <Svg nome="check" tamanho={16} />}
          {nomeDoIdioma(codigo)}
        </button>
      ))}
    </div>
  );
}

function ExcluirConta({ excluirConta }) {
  const [confirmando, setConfirmando] = useState(false);
  const { executar, ocupado, erro } = useAcao(excluirConta);
  const t = useTextos(traducoes);

  return (
    <section className="painel-cartao perfil-perigo" aria-labelledby="excluir-titulo">
      <h2 id="excluir-titulo" className="painel-titulo">
        {t.excluirConta}
      </h2>
      <p>{t.excluirContaTexto}</p>
      {confirmando ? (
        <div className="vol-confirmar">
          <span>{t.temCerteza}</span>
          <div className="vol-acoes">
            <button type="button" className="vol-botao-perigo vol-botao-cheio" onClick={executar} disabled={ocupado}>
              {ocupado ? t.excluindo : t.simExcluirConta}
            </button>
            <button type="button" className="vol-botao-secundario" onClick={() => setConfirmando(false)} disabled={ocupado}>
              {t.nao}
            </button>
          </div>
          {erro && (
            <p className="vol-erro" role="alert">
              {erro}
            </p>
          )}
        </div>
      ) : (
        <button type="button" className="vol-botao-perigo" onClick={() => setConfirmando(true)}>
          {t.excluirMinhaConta}
        </button>
      )}
    </section>
  );
}

// foto do perfil: reduz no navegador e salva pelo PUT /me
function FotoPerfil({ perfil, salvarPerfil }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const t = useTextos(traducoes);

  async function escolher(evento) {
    const arquivo = evento.target.files[0];
    evento.target.value = "";
    if (!arquivo) return;
    setOcupado(true);
    setErro("");
    try {
      const foto = await reduzirFoto(arquivo);
      const mensagem = await salvarPerfil({ foto });
      if (mensagem) setErro(mensagem);
    } catch (falha) {
      setErro(falha.message);
    }
    setOcupado(false);
  }

  async function remover() {
    setOcupado(true);
    setErro("");
    const mensagem = await salvarPerfil({ foto: null });
    if (mensagem) setErro(mensagem);
    setOcupado(false);
  }

  return (
    <div className="perfil-foto">
      <Avatar nome={perfil.nome} foto={perfil.foto} className="perfil-avatar" />
      <div className="perfil-foto-acoes">
        <label className={`perfil-foto-botao${ocupado ? " perfil-foto-ocupado" : ""}`}>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={escolher} disabled={ocupado} />
          {ocupado ? t.enviando : perfil.foto ? t.trocarFoto : t.adicionarFoto}
        </label>
        {perfil.foto && !ocupado && (
          <button type="button" className="perfil-foto-remover" onClick={remover}>
            {t.remover}
          </button>
        )}
      </div>
      {erro && (
        <p className="vol-erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

function AbaDados({ painel }) {
  const { perfil } = painel;
  const voluntario = perfil.voluntario;
  const salvar = (campos) => painel.salvarPerfil(campos);
  const { idioma } = useIdioma();
  const t = useTextos(traducoes);

  return (
    <>
      <section className="painel-cartao perfil-identidade" aria-label={t.suaConta}>
        <FotoPerfil perfil={perfil} salvarPerfil={painel.salvarPerfil} />
        <div className="perfil-identidade-texto">
          <h2>{perfil.nome}</h2>
          <p>
            <Svg nome="email" tamanho={16} /> {perfil.email}
          </p>
          <p>
            <Svg nome="maleta" tamanho={16} /> {nomeDaArea(painel.area, idioma)}
          </p>
        </div>
      </section>

      <section className="painel-cartao perfil-bloco" aria-label={t.contatoIdiomas}>
        <CampoEditavel
          id="campo-telefone"
          icone="telefone"
          rotulo={t.telefone}
          plano
          mostrar={perfil.telefone}
          vazio={t.naoInformadoOpcional}
          inicial={perfil.telefone ?? ""}
          aoSalvar={(v) => salvar({ telefone: v.trim() || null })}
          editor={(v, setV, id) => (
            <input
              id={id}
              className="perfil-input"
              aria-labelledby={`${id}-rotulo`}
              value={v}
              maxLength={20}
              onChange={(e) => setV(e.target.value)}
              autoComplete="tel"
              placeholder="(11) 91234-5678"
            />
          )}
        />
        <CampoEditavel
          id="campo-pais"
          icone="globo"
          rotulo={t.nacionalidade}
          plano
          mostrar={perfil.pais_origem}
          inicial={perfil.pais_origem ?? ""}
          aoSalvar={(v) => salvar({ pais_origem: v.trim() || null })}
          editor={(v, setV, id) => (
            <input id={id} className="perfil-input" aria-labelledby={`${id}-rotulo`} value={v} maxLength={60} onChange={(e) => setV(e.target.value)} placeholder={t.exPais} />
          )}
        />
        <CampoEditavel
          id="campo-idiomas"
          icone="idioma"
          rotulo={t.idiomasAtende}
          plano
          mostrar={
            voluntario.idiomas?.length ? (
              <span className="perfil-etiquetas">
                {voluntario.idiomas.map((codigo) => (
                  <span key={codigo}>{nomeDoIdioma(codigo)}</span>
                ))}
              </span>
            ) : null
          }
          inicial={voluntario.idiomas ?? []}
          aoSalvar={(v) => (v.length ? salvar({ voluntario: { idiomas: v } }) : Promise.resolve(t.erroIdioma))}
          editor={(v, setV, id) => <ChipsIdiomas valor={v} setValor={setV} id={id} />}
        />
      </section>

      <CampoEditavel
          id="campo-bio"
          icone="texto"
          rotulo={t.sobreVoce}
          largo
          mostrar={voluntario.bio}
          vazio={t.bioVazia}
          inicial={voluntario.bio ?? ""}
          aoSalvar={(v) => salvar({ voluntario: { bio: v.trim() || null } })}
          editor={(v, setV, id) => (
            <>
              <textarea
                id={id}
                className="perfil-input"
                aria-labelledby={`${id}-rotulo`}
                rows={4}
                maxLength={500}
                value={v}
                onChange={(e) => setV(e.target.value)}
                placeholder={t.bioPlaceholder}
              />
              <span className="dica">{t.caracteres(v.length)}</span>
            </>
          )}
        />

      <ExcluirConta excluirConta={painel.excluirConta} />
    </>
  );
}

function AbaServicos({ painel }) {
  const voluntario = painel.perfil.voluntario;
  const { idioma } = useIdioma();
  const t = useTextos(traducoes);

  return (
    <>
      <div className="perfil-grade">
        {/* a área é escolhida no cadastro e não muda, como nome e e-mail */}
        <CampoFixo icone="maleta" rotulo={t.areaAtuacao} valor={nomeDaArea(painel.area, idioma)} />
        <CampoEditavel
          id="campo-registro"
          icone="registro"
          rotulo={t.registro}
          mostrar={voluntario.registro_profissional}
          vazio={t.naoInformadoOpcional}
          inicial={voluntario.registro_profissional ?? ""}
          aoSalvar={(v) => painel.salvarPerfil({ voluntario: { registro_profissional: v.trim() || null } })}
          editor={(v, setV, id) => (
            <input
              id={id}
              className="perfil-input"
              aria-labelledby={`${id}-rotulo`}
              value={v}
              maxLength={40}
              onChange={(e) => setV(e.target.value)}
              placeholder={t.exRegistro}
            />
          )}
        />
      </div>
      <GerenciarServicos painel={painel} />
    </>
  );
}

export default function Perfil() {
  const painel = useOutletContext();
  const [parametros, setParametros] = useSearchParams();
  const t = useTextos(traducoes);
  const aba = ABAS.includes(parametros.get("aba")) ? parametros.get("aba") : "dados";
  const ativo = painel.perfil.voluntario.ativo;
  const busca = useAcao(() => painel.salvarPerfil({ voluntario: { ativo: !ativo } }));

  return (
    <>
      <header className="painel-cabecalho">
        {/* o interruptor da busca fica ao lado do título */}
        <div className="perfil-titulo">
          <h1>{t.meuPerfil}</h1>
          <Interruptor ligado={ativo} aoMudar={busca.executar} desabilitado={busca.ocupado} rotulo={ativo ? t.aparecendoBusca : t.foraBusca} />
        </div>
        <p>{t.perfilSubtitulo}</p>
        {busca.erro && (
          <p className="vol-erro" role="alert">
            {busca.erro}
          </p>
        )}
      </header>

      <div className="perfil-abas" role="tablist" aria-label={t.partesPerfil}>
        {ABAS.map((chave) => (
          <button
            key={chave}
            type="button"
            role="tab"
            id={`aba-${chave}`}
            aria-selected={aba === chave}
            aria-controls="perfil-aba-conteudo"
            onClick={() => setParametros({ aba: chave })}
          >
            {t.abas[chave]}
          </button>
        ))}
      </div>

      <div id="perfil-aba-conteudo" role="tabpanel" aria-labelledby={`aba-${aba}`} className="perfil-aba">
        {aba === "dados" && <AbaDados painel={painel} />}
        {aba === "servicos" && <AbaServicos painel={painel} />}
        {aba === "agenda" && <Horarios horarios={painel.horarios} criarHorarios={painel.criarHorarios} excluirHorario={painel.excluirHorario} />}
      </div>
    </>
  );
}
