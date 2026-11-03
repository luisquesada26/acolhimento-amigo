import { useState } from "react";
import { useTextos } from "../context/IdiomaContext";
import { traducoes } from "./rodape-traducoes";
import "./rodape-app.css";

// fase de exemplos: a opção guardada e a BarraRodape saem depois que o Luis escolher
const CHAVE_OPCAO = "acolhimento-opcao-rodape";
const OPCOES = [
  ["a", "Igual à inicial"],
  ["b", "Fino"],
  ["c", "Ajuda"],
];

const TELEFONES = [
  ["190", "policia"],
  ["192", "samu"],
  ["193", "bombeiros"],
  ["180", "mulher"],
  ["100", "direitos"],
];

function opcaoSalva() {
  try {
    const salva = localStorage.getItem(CHAVE_OPCAO);
    return OPCOES.some(([chave]) => chave === salva) ? salva : "a";
  } catch {
    return "a";
  }
}

// A: o mesmo rodapé da página inicial (as classes vêm do Inicio.css), sem os links de âncora
function RodapeCompleto({ t, ano }) {
  return (
    <footer className="rodape-inicio rod">
      <div className="conteudo-rodape">
        <div className="marca-rodape">
          <img src="/images/logo-branco.svg" alt="Acolhimento Amigo" className="logo-rodape" />
          <span>{t.descricao}</span>
        </div>
      </div>
      <p className="copyright">
        © {ano} Acolhimento Amigo. {t.direitos}
      </p>
    </footer>
  );
}

// B: uma linha só, para não disputar atenção com a tela
function RodapeFino({ t, ano }) {
  return (
    <footer className="rod rod-fino">
      <img src="/images/logo.svg" alt="Acolhimento Amigo" className="rod-fino-logo" />
      <span>© {ano} Acolhimento Amigo</span>
      <span className="rod-fino-projeto">{t.projeto}</span>
    </footer>
  );
}

// C: os telefones públicos de emergência do Brasil, para quem chegou agora no país
function RodapeAjuda({ t, ano }) {
  return (
    <footer className="rod rod-ajuda">
      <section className="rod-ajuda-emergencia" aria-labelledby="rod-ajuda-titulo">
        <div className="rod-ajuda-cabeca">
          <h2 id="rod-ajuda-titulo">{t.emergencia}</h2>
          <p>{t.gratuito}</p>
        </div>
        <ul className="rod-ajuda-lista">
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
      <p className="rod-ajuda-copy">
        © {ano} Acolhimento Amigo. {t.direitos}
      </p>
    </footer>
  );
}

function BarraRodape({ opcao, aoEscolher }) {
  return (
    <div className="rod-opcoes" role="group" aria-label="Opções de exemplo do rodapé">
      <span>Rodapé</span>
      {OPCOES.map(([chave, nome]) => (
        <button
          key={chave}
          type="button"
          aria-pressed={opcao === chave}
          className={opcao === chave ? "rod-opcoes-ligada" : ""}
          onClick={() => aoEscolher(chave)}
        >
          <strong>{chave.toUpperCase()}</strong> {nome}
        </button>
      ))}
    </div>
  );
}

// rodapé das áreas do usuário e do voluntário
export default function RodapeApp() {
  const t = useTextos(traducoes);
  const [opcao, setOpcao] = useState(opcaoSalva);
  const ano = new Date().getFullYear();

  function escolher(nova) {
    setOpcao(nova);
    try {
      localStorage.setItem(CHAVE_OPCAO, nova);
    } catch {
      // sem localStorage só não lembra a escolha
    }
  }

  return (
    <>
      {opcao === "a" && <RodapeCompleto t={t} ano={ano} />}
      {opcao === "b" && <RodapeFino t={t} ano={ano} />}
      {opcao === "c" && <RodapeAjuda t={t} ano={ano} />}
      <BarraRodape opcao={opcao} aoEscolher={escolher} />
    </>
  );
}
