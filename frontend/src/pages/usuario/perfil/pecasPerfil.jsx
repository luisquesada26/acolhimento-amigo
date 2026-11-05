import { useLayoutEffect, useRef, useState } from "react";
import Avatar, { ERROS_FOTO, reduzirFoto } from "../../../components/Avatar";
import CampoPais from "../../../components/CampoPais";
import { Bandeira } from "../../../components/SeletorIdioma";
import { useIdioma, useTextos } from "../../../context/IdiomaContext";
import { chaveDoPais, nomeDoPais } from "../../../dados/paises";
import { traduzirMensagem } from "../../../services/errosApi";
import { Svg } from "../../voluntario/comum";
import { traducoes } from "../traducoes";

export const IDIOMAS_PERFIL = [
  { codigo: "pt", nome: "Português" },
  { codigo: "en", nome: "English" },
  { codigo: "es", nome: "Español" },
  { codigo: "fr", nome: "Français" },
];

// o que o formulário do perfil confere antes de chamar a API; devolve a chave de cada erro em traducoes.erros
export function validarPerfil(dados) {
  const novos = {};
  if (dados.nome !== undefined && dados.nome.trim().length < 3) novos.nome = "nome";
  if (dados.email !== undefined && !/^\S+@\S+\.\S+$/.test(dados.email.trim())) novos.email = "email";
  if (dados.telefone.replace(/\D/g, "").length < 10) novos.telefone = "telefone";
  if (!dados.pais_origem.trim()) novos.pais_origem = "nacionalidade";
  if (!dados.idiomas.length) novos.idiomas = "idiomas";
  return novos;
}

// o erro fica guardado como chave da validação ou como a API mandou, e é traduzido aqui, na hora de mostrar
export function useErros() {
  const erros = useTextos(traducoes).erros;
  return (valor) => traduzirMensagem(valor, erros);
}

// trocando a bandeira, o país que a pessoa não mexeu no formulário troca de idioma junto
export function usePaisNaBandeira(salvo, setDados) {
  const { idioma } = useIdioma();
  useLayoutEffect(() => {
    const nome = nomeDoPais(salvo ?? "");
    setDados((atual) => (atual.pais_origem !== nome && chaveDoPais(atual.pais_origem) === chaveDoPais(salvo ?? "") ? { ...atual, pais_origem: nome } : atual));
  }, [idioma]); // o idioma muda o locale lido por nomeDoPais
}

export function FotoPerfil({ nome, foto, aoMudar }) {
  const t = useTextos(traducoes).perfil;
  const errosFoto = useTextos(ERROS_FOTO);
  const entrada = useRef(null);
  const [erro, setErro] = useState("");

  async function escolher(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    try {
      setErro("");
      aoMudar(await reduzirFoto(arquivo));
    } catch (problema) {
      setErro(problema.chave);
    }
  }

  return (
    <div className="pf-foto">
      <Avatar nome={nome} foto={foto} className="pf-foto-avatar" />
      <div className="pf-foto-acoes">
        <button type="button" className="pf-botao-contorno" onClick={() => entrada.current?.click()}>
          <Svg nome="perfil" tamanho={16} /> {foto ? t.trocarFoto : t.colocarFoto}
        </button>
        {foto && (
          <button type="button" className="pf-link" onClick={() => aoMudar(null)}>
            {t.tirarFoto}
          </button>
        )}
        <small>{t.fotoDica}</small>
        {erro && <span className="campo-erro">{errosFoto[erro]}</span>}
      </div>
      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={escolher} />
    </div>
  );
}

// a pessoa marca todos os idiomas que entende; a ordem segue a da lista
export function EscolhaIdiomas({ valor, aoMudar, erro }) {
  const t = useTextos(traducoes).perfil;

  function alternar(codigo) {
    const marcados = valor.includes(codigo) ? valor.filter((c) => c !== codigo) : [...valor, codigo];
    aoMudar(IDIOMAS_PERFIL.map((i) => i.codigo).filter((c) => marcados.includes(c)));
  }

  return (
    <fieldset className="campo pf-idiomas" aria-describedby={erro ? "pf-idiomas-erro" : undefined}>
      <legend>{t.idiomasPergunta}</legend>
      <span className="dica">{t.idiomasDica}</span>
      {/* as colunas seguem a largura do campo, não a da tela */}
      <div className="pf-idiomas-caixa">
        <div className="pf-idiomas-opcoes">
          {IDIOMAS_PERFIL.map((i) => {
            const marcado = valor.includes(i.codigo);
            return (
              <label key={i.codigo} lang={i.codigo} className={marcado ? "pf-idioma pf-idioma-ligado" : "pf-idioma"}>
                <input type="checkbox" value={i.codigo} checked={marcado} onChange={() => alternar(i.codigo)} />
                <Bandeira codigo={i.codigo} />
                {i.nome}
              </label>
            );
          })}
        </div>
      </div>
      {erro && (
        <span id="pf-idiomas-erro" className="campo-erro">
          {erro}
        </span>
      )}
    </fieldset>
  );
}

// a nacionalidade do usuário, no primeiro acesso e no Meu perfil
export function CampoNacionalidade({ valor, aoMudar, erro }) {
  const t = useTextos(traducoes).perfil;
  return (
    <div className="campo">
      <label htmlFor="pf-pais" id="pf-pais-rotulo">
        {t.nacionalidade}
      </label>
      <CampoPais
        id="pf-pais"
        rotuloId="pf-pais-rotulo"
        valor={valor}
        aoMudar={aoMudar}
        invalido={Boolean(erro)}
        descricaoId={erro ? "pf-pais-erro" : undefined}
        placeholder={t.comeceEscrever}
        textos={{ mostrar: t.paisMostrar, nenhum: t.paisNenhum }}
      />
      {erro && (
        <span id="pf-pais-erro" className="campo-erro">
          {erro}
        </span>
      )}
    </div>
  );
}
