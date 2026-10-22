import { useEffect, useRef, useState } from "react";
import "./seletor-idioma.css";

const CHAVE_IDIOMA = "acolhimento:idioma";

// cada idioma com o nome escrito nele mesmo, como a pessoa procura
const IDIOMAS = [
  { codigo: "pt", sigla: "PT", nome: "Português" },
  { codigo: "en", sigla: "EN", nome: "English" },
  { codigo: "es", sigla: "ES", nome: "Español" },
  { codigo: "fr", sigla: "FR", nome: "Français" },
];

// bandeiras desenhadas aqui: o Windows não mostra emoji de bandeira
function Bandeira({ codigo }) {
  return (
    <svg className="bandeira" width="24" height="16" viewBox="0 0 24 16" aria-hidden="true">
      {codigo === "pt" && (
        <>
          <rect width="24" height="16" fill="#009c3b" />
          <path d="M12 2.2 21 8l-9 5.8L3 8z" fill="#ffdf00" />
          <circle cx="12" cy="8" r="3.6" fill="#002776" />
          <path d="M8.6 7.3c2.3-.6 4.7-.3 6.8.9" stroke="#fff" strokeWidth=".8" fill="none" />
        </>
      )}
      {codigo === "en" && (
        <>
          <rect width="24" height="16" fill="#fff" />
          {[0, 2, 4, 6, 8, 10, 12].map((i) => (
            <rect key={i} y={(i * 16) / 13} width="24" height={16 / 13} fill="#b22234" />
          ))}
          <rect width="10.4" height={(16 / 13) * 7} fill="#3c3b6e" />
        </>
      )}
      {codigo === "es" && (
        <>
          <rect width="24" height="16" fill="#aa151b" />
          <rect y="4" width="24" height="8" fill="#f1bf00" />
        </>
      )}
      {codigo === "fr" && (
        <>
          <rect width="8" height="16" fill="#002395" />
          <rect x="8" width="8" height="16" fill="#fff" />
          <rect x="16" width="8" height="16" fill="#ed2939" />
        </>
      )}
    </svg>
  );
}

function lerIdioma() {
  try {
    return localStorage.getItem(CHAVE_IDIOMA) || "pt";
  } catch {
    return "pt";
  }
}

// por enquanto só troca a bandeira; a tradução do app vem depois
export default function SeletorIdioma({ claro = false }) {
  const [codigo, setCodigo] = useState(lerIdioma);
  const [aberto, setAberto] = useState(false);
  const caixa = useRef(null);
  const atual = IDIOMAS.find((i) => i.codigo === codigo) ?? IDIOMAS[0];

  // fecha clicando fora ou com Esc
  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => !caixa.current.contains(e.target) && setAberto(false);
    const tecla = (e) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  function escolher(novo) {
    setCodigo(novo);
    setAberto(false);
    try {
      localStorage.setItem(CHAVE_IDIOMA, novo);
    } catch {
      // sem localStorage só não lembra a escolha
    }
  }

  return (
    <div className={claro ? "idioma idioma-claro" : "idioma"} ref={caixa}>
      <button
        type="button"
        className="idioma-botao"
        aria-expanded={aberto}
        aria-controls="idioma-lista"
        aria-label={`Idioma: ${atual.nome}. Trocar idioma`}
        onClick={() => setAberto(!aberto)}
      >
        <Bandeira codigo={atual.codigo} />
        <span>{atual.sigla}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {aberto && (
        <ul className="idioma-lista" id="idioma-lista">
          {IDIOMAS.map((i) => (
            <li key={i.codigo}>
              <button type="button" lang={i.codigo} aria-current={i.codigo === codigo ? "true" : undefined} onClick={() => escolher(i.codigo)}>
                <Bandeira codigo={i.codigo} />
                {i.nome}
                {i.codigo === codigo && (
                  <svg className="idioma-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
