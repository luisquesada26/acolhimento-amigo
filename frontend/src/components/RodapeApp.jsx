import { ArrowUp } from "lucide-react";
import { useTextos } from "../context/IdiomaContext";
import { traducoes } from "./rodape-traducoes";
import "./rodape-app.css";

// telefones públicos de emergência do Brasil, para quem chegou agora no país
const TELEFONES = [
  ["190", "policia"],
  ["192", "samu"],
  ["193", "bombeiros"],
  ["180", "mulher"],
  ["100", "direitos"],
];

// nas duas áreas quem rola é a janela; o foco vai para o main, para o teclado seguir do começo
function voltarAoTopo() {
  const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: semAnimacao ? "auto" : "smooth" });
  const inicio = document.querySelector("main");
  if (!inicio) return;
  if (!inicio.hasAttribute("tabindex")) inicio.setAttribute("tabindex", "-1");
  inicio.focus({ preventScroll: true });
}

// rodapé das áreas do usuário e do voluntário; a faixa azul é a mesma da página inicial
export default function RodapeApp() {
  const t = useTextos(traducoes);

  return (
    <footer className="rodape-inicio rod">
      <div className="rod-linha">
        <div className="rod-marca">
          <img src="/images/logo-branco.svg" alt="Acolhimento Amigo" className="rod-logo" />
          <span>{t.descricao}</span>
        </div>

        <section className="rod-emergencia" aria-labelledby="rod-emergencia-titulo">
          <div className="rod-emergencia-cabeca">
            <h2 id="rod-emergencia-titulo">{t.emergencia}</h2>
            <p>{t.gratuito}</p>
          </div>
          <ul className="rod-telefones">
            {TELEFONES.map(([numero, chave]) => (
              <li key={numero}>
                <a href={`tel:${numero}`} aria-label={t.ligarPara(numero, t.telefones[chave])}>
                  <strong>{numero}</strong>
                  <span>{t.telefones[chave]}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="rod-baixo">
        <p className="rod-copy">
          © {new Date().getFullYear()} Acolhimento Amigo. {t.direitos}
        </p>
        <button type="button" className="rod-topo" onClick={voltarAoTopo}>
          <ArrowUp size={16} aria-hidden="true" />
          {t.voltarTopo}
        </button>
      </div>
    </footer>
  );
}
