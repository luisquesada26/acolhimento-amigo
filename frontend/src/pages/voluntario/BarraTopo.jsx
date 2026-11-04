import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "../login/Campos";
import SeletorIdioma from "../../components/SeletorIdioma";
import Avatar from "../../components/Avatar";
import { useTextos } from "../../context/IdiomaContext";
import { NAVEGACAO, Svg } from "./comum";
import { traducoes } from "./traducoes";

// a página aberta é o caminho mais longo do menu que bate com o endereço
function paginaAtual(pathname) {
  return NAVEGACAO.filter((item) => pathname === item.caminho || pathname.startsWith(`${item.caminho}/`)).sort(
    (a, b) => b.caminho.length - a.caminho.length,
  )[0];
}

// foto, nome e status; abre o menu com meu perfil e sair
function MenuConta({ perfil, sair }) {
  const t = useTextos(traducoes);
  const [aberto, setAberto] = useState(false);
  const caixa = useRef(null);
  const botao = useRef(null);
  const id = useId();
  const naBusca = perfil.voluntario.ativo;

  useEffect(() => {
    if (!aberto) return undefined;
    const itens = () => [...caixa.current.querySelectorAll('[role="menuitem"]')];
    itens()[0]?.focus();

    function cliqueFora(evento) {
      if (!caixa.current.contains(evento.target)) setAberto(false);
    }

    function teclado(evento) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        setAberto(false);
        botao.current?.focus();
      } else if (evento.key === "Tab") {
        setAberto(false);
      } else if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
        evento.preventDefault();
        const lista = itens();
        const passo = evento.key === "ArrowDown" ? 1 : -1;
        const atual = lista.indexOf(document.activeElement);
        lista[(atual + passo + lista.length) % lista.length]?.focus();
      }
    }

    document.addEventListener("mousedown", cliqueFora);
    document.addEventListener("keydown", teclado);
    return () => {
      document.removeEventListener("mousedown", cliqueFora);
      document.removeEventListener("keydown", teclado);
    };
  }, [aberto]);

  return (
    <div className="barra-conta" ref={caixa}>
      <button
        ref={botao}
        type="button"
        className="barra-conta-botao"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? id : undefined}
        onClick={() => setAberto((atual) => !atual)}
      >
        <Avatar nome={perfil.nome} foto={perfil.foto} className="barra-conta-avatar">
          <span className={naBusca ? "painel-status painel-status-ativo" : "painel-status"}></span>
        </Avatar>
        <span className="barra-conta-texto">
          <strong>{perfil.nome}</strong>
          <small className={naBusca ? "barra-conta-ativo" : undefined}>{naBusca ? t.naBusca : t.pausado}</small>
        </span>
        <span className="barra-conta-seta">
          <Svg nome="descer" tamanho={16} />
        </span>
      </button>

      {aberto && (
        <div className="barra-conta-caixa">
          <div className="barra-conta-quem">
            <strong>{perfil.nome}</strong>
            {perfil.email && <small>{perfil.email}</small>}
          </div>
          <div id={id} role="menu" aria-label={t.suaConta}>
            <Link role="menuitem" to="/voluntario/perfil" className="barra-conta-item" onClick={() => setAberto(false)}>
              <Svg nome="perfil" tamanho={18} />
              {t.menu.perfil}
            </Link>
            <button role="menuitem" type="button" className="barra-conta-item barra-conta-sair" onClick={sair}>
              <Svg nome="sair" tamanho={18} />
              {t.sair}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// barra de cima das telas do voluntário: onde a pessoa está, o idioma e a conta
// o logo só aparece no celular, quando o menu vai para baixo
export default function BarraTopo({ perfil, sair }) {
  const { pathname } = useLocation();
  const t = useTextos(traducoes);
  const pagina = paginaAtual(pathname);

  return (
    <header className="painel-barra">
      <Link to="/voluntario" className="painel-barra-logo" aria-label={t.menu.painel}>
        <Logo />
      </Link>

      <nav className="painel-trilha" aria-label={t.trilha}>
        <ol>
          <li>
            <Link to="/voluntario">{t.areaDoVoluntario}</Link>
          </li>
          {pagina && (
            <li>
              <span aria-current="page">{t.menu[pagina.icone]}</span>
            </li>
          )}
        </ol>
      </nav>

      <div className="painel-barra-acoes">
        <SeletorIdioma />
        <MenuConta perfil={perfil} sair={sair} />
      </div>
    </header>
  );
}
