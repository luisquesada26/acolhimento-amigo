import { createContext, useContext, useEffect, useState } from "react";

const CHAVE_IDIOMA = "acolhimento:idioma";
const CODIGOS = ["pt", "en", "es", "fr"];

// o lang da página acompanha o idioma, para o leitor de tela ler com a pronúncia certa
export const LANG = { pt: "pt-BR", en: "en", es: "es", fr: "fr" };

const IdiomaContext = createContext(null);

function lerIdioma() {
  try {
    const salvo = localStorage.getItem(CHAVE_IDIOMA);
    return CODIGOS.includes(salvo) ? salvo : "pt";
  } catch {
    return "pt";
  }
}

// funções fora de componente (datas, erros da API) leem o idioma por aqui
let atual = lerIdioma();

export function idiomaAtual() {
  return atual;
}

export function localeAtual() {
  return LANG[atual];
}

// o idioma da bandeira é um só: vale na página inicial, no login e dentro do app
export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(lerIdioma);

  // a tag <html> também: o leitor de tela e o tradutor do navegador olham para ela
  useEffect(() => {
    document.documentElement.lang = LANG[idioma];
  }, [idioma]);

  function trocarIdioma(novo) {
    atual = novo;
    setIdioma(novo);
    try {
      localStorage.setItem(CHAVE_IDIOMA, novo);
    } catch {
      // sem localStorage só não lembra a escolha
    }
  }

  return <IdiomaContext.Provider value={{ idioma, trocarIdioma }}>{children}</IdiomaContext.Provider>;
}

export function useIdioma() {
  return useContext(IdiomaContext);
}

// os textos de uma tela no idioma da bandeira; se faltar o idioma, fica o português
export function useTextos(traducoes) {
  const { idioma } = useIdioma();
  return traducoes[idioma] ?? traducoes.pt;
}

// o mesmo para funções fora de componente; quem chama já re-renderiza com useTextos
export function textosAtuais(traducoes) {
  return traducoes[atual] ?? traducoes.pt;
}
