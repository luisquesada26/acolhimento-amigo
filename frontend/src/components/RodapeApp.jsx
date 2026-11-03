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

      <p className="rod-copy">
        © {new Date().getFullYear()} Acolhimento Amigo. {t.direitos}
      </p>
    </footer>
  );
}
