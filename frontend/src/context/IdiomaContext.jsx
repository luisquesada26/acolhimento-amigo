import { createContext, useContext, useState } from "react";

const CHAVE_IDIOMA = "acolhimento:idioma";
const CODIGOS = ["pt", "en", "es", "fr"];

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
