import { useRef, useState } from "react";
import Avatar, { reduzirFoto } from "../../../components/Avatar";
import { Bandeira } from "../../../components/SeletorIdioma";
import { Svg } from "../../voluntario/comum";

// sugestões no campo de país; a pessoa pode escrever outro
export const PAISES = [
  "Afeganistão",
  "Angola",
  "Argentina",
  "Bangladesh",
  "Bolívia",
  "Brasil",
  "Camarões",
  "China",
  "Colômbia",
  "Cuba",
  "Equador",
  "Gana",
  "Guiné-Bissau",
  "Haiti",
  "Líbano",
  "Marrocos",
  "Moçambique",
  "Nigéria",
  "Palestina",
  "Paraguai",
  "Peru",
  "República Democrática do Congo",
  "Senegal",
  "Síria",
  "Ucrânia",
  "Uruguai",
  "Venezuela",
];

export const IDIOMAS_PERFIL = [
  { codigo: "pt", nome: "Português" },
  { codigo: "en", nome: "English" },
  { codigo: "es", nome: "Español" },
  { codigo: "fr", nome: "Français" },
];

// o que o formulário do perfil confere antes de chamar a API
export function validarPerfil(dados) {
  const erros = {};
  if (dados.nome !== undefined && dados.nome.trim().length < 3) erros.nome = "Digite seu nome completo";
  if (dados.email !== undefined && !/^\S+@\S+\.\S+$/.test(dados.email.trim())) erros.email = "Digite um e-mail válido";
  if (dados.telefone.replace(/\D/g, "").length < 10) erros.telefone = "Digite o telefone com DDD, só números";
  if (!dados.pais_origem.trim()) erros.pais_origem = "Escreva a sua nacionalidade";
  if (!dados.idiomas.length) erros.idiomas = "Marque pelo menos um idioma";
  return erros;
}

export function FotoPerfil({ nome, foto, aoMudar }) {
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
          <Svg nome="perfil" tamanho={16} /> {foto ? "Trocar foto" : "Colocar foto"}
        </button>
        {foto && (
          <button type="button" className="pf-link" onClick={() => aoMudar(null)}>
            Tirar foto
          </button>
        )}
        <small>Opcional. Ajuda o voluntário a reconhecer você na chamada.</small>
        {erro && <span className="campo-erro">{erro}</span>}
      </div>
      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={escolher} />
    </div>
  );
}

// a pessoa marca todos os idiomas que entende; a ordem segue a da lista
export function EscolhaIdiomas({ valor, aoMudar, erro }) {
  function alternar(codigo) {
    const marcados = valor.includes(codigo) ? valor.filter((c) => c !== codigo) : [...valor, codigo];
    aoMudar(IDIOMAS_PERFIL.map((i) => i.codigo).filter((c) => marcados.includes(c)));
  }

  return (
    <fieldset className="campo pf-idiomas" aria-describedby={erro ? "pf-idiomas-erro" : undefined}>
      <legend>Em quais idiomas você pode ser atendido?</legend>
      <span className="dica">Marque todos os que você entende.</span>
      <div className="pf-idiomas-opcoes">
        {IDIOMAS_PERFIL.map((i) => {
          const marcado = valor.includes(i.codigo);
          return (
            <label key={i.codigo} className={marcado ? "pf-idioma pf-idioma-ligado" : "pf-idioma"}>
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

// "Español e Português", para o cartão do perfil
export function nomesDosIdiomas(codigos = []) {
  const nomes = IDIOMAS_PERFIL.filter((i) => codigos.includes(i.codigo)).map((i) => i.nome);
  return nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}` : (nomes[0] ?? "");
}

export function ListaPaises({ id }) {
  return (
    <datalist id={id}>
      {PAISES.map((p) => (
        <option key={p} value={p} />
      ))}
    </datalist>
  );
}
