import { useMemo, useRef, useState } from "react";
import Avatar, { reduzirFoto } from "../../../components/Avatar";
import { Bandeira } from "../../../components/SeletorIdioma";
import { localeAtual, useIdioma, useTextos } from "../../../context/IdiomaContext";
import { Svg } from "../../voluntario/comum";
import { traducoes } from "../traducoes";

// países sugeridos no campo de nacionalidade, pelo código ISO; o nome sai no idioma da bandeira
// a pessoa pode escrever outro
const PAISES = ["AF", "AO", "AR", "BD", "BO", "BR", "CM", "CN", "CO", "CU", "EC", "GH", "GW", "HT", "LB", "MA", "MZ", "NG", "PS", "PY", "PE", "CD", "SN", "SY", "UA", "UY", "VE"];

export const IDIOMAS_PERFIL = [
  { codigo: "pt", nome: "Português" },
  { codigo: "en", nome: "English" },
  { codigo: "es", nome: "Español" },
  { codigo: "fr", nome: "Français" },
];

// o que o formulário do perfil confere antes de chamar a API; erros = traducoes[idioma].erros
export function validarPerfil(dados, erros) {
  const novos = {};
  if (dados.nome !== undefined && dados.nome.trim().length < 3) novos.nome = erros.nome;
  if (dados.email !== undefined && !/^\S+@\S+\.\S+$/.test(dados.email.trim())) novos.email = erros.email;
  if (dados.telefone.replace(/\D/g, "").length < 10) novos.telefone = erros.telefone;
  if (!dados.pais_origem.trim()) novos.pais_origem = erros.nacionalidade;
  if (!dados.idiomas.length) novos.idiomas = erros.idiomas;
  return novos;
}

export function FotoPerfil({ nome, foto, aoMudar }) {
  const t = useTextos(traducoes).perfil;
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
      setErro(problema.message);
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
        {erro && <span className="campo-erro">{erro}</span>}
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
      {erro && (
        <span id="pf-idiomas-erro" className="campo-erro">
          {erro}
        </span>
      )}
    </fieldset>
  );
}

export function ListaPaises({ id }) {
  const { idioma } = useIdioma();
  const nomes = useMemo(() => {
    const regioes = new Intl.DisplayNames([localeAtual()], { type: "region" });
    return PAISES.map((codigo) => regioes.of(codigo)).sort((a, b) => a.localeCompare(b, localeAtual()));
  }, [idioma]); // o idioma muda o locale lido por localeAtual()

  return (
    <datalist id={id}>
      {nomes.map((p) => (
        <option key={p} value={p} />
      ))}
    </datalist>
  );
}
