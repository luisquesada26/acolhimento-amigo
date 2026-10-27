import { createContext, useContext, useState } from "react";

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

// o idioma da bandeira é um só: vale na página inicial, no login e dentro do app
export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(lerIdioma);

  function trocarIdioma(novo) {
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
