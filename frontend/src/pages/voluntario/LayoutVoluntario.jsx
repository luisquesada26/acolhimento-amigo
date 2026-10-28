import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Logo } from "../login/Campos";
import SeletorIdioma from "../../components/SeletorIdioma";
import Avatar from "../../components/Avatar";
import { LANG, useIdioma, useTextos } from "../../context/IdiomaContext";
import usePainel from "./usePainel";
import { NAVEGACAO, Svg } from "./comum";
import { traducoes } from "./traducoes";
import "./painel.css";
import "./paginas.css";

const CHAVE_MENU = "acolhimento:menu-recolhido";

function lerMenuRecolhido() {
  try {
    return localStorage.getItem(CHAVE_MENU) === "sim";
  } catch {
    return false;
  }
}

// menu lateral das telas do voluntário; os dados carregam aqui e as telas recebem pelo Outlet
export default function LayoutVoluntario() {
  const painel = usePainel();
  const [recolhido, setRecolhido] = useState(lerMenuRecolhido);
  const { idioma } = useIdioma();
  const t = useTextos(traducoes);

  function alternarMenu() {
    const novo = !recolhido;
    setRecolhido(novo);
    try {
      localStorage.setItem(CHAVE_MENU, novo ? "sim" : "nao");
    } catch {
      // sem localStorage o menu só não lembra a escolha
    }
  }

  if (painel.carregando) {
    return (
      <main className="painel-estado" lang={LANG[idioma]}>
        <p>{t.carregando}</p>
      </main>
    );
  }

  if (painel.erro) {
    return (
      <main className="painel-estado" lang={LANG[idioma]}>
        <p className="aviso" role="alert">
          {painel.erro}
        </p>
        <button type="button" className="botao botao-primario" onClick={painel.recarregar}>
          {t.tentarDeNovo}
        </button>
      </main>
    );
  }

  const { perfil } = painel;
  const grupos = [...new Set(NAVEGACAO.map((item) => item.grupo))];
  const naBusca = perfil.voluntario.ativo;

  return (
    <div className={recolhido ? "painel painel-recolhido" : "painel"} lang={LANG[idioma]}>
      <aside className="painel-menu">
        <div className="painel-menu-topo">
          <Logo claro />
        </div>
        {/* botão redondo preso na borda do menu */}
        <button
          type="button"
          className="painel-recolher"
          onClick={alternarMenu}
          aria-expanded={!recolhido}
          aria-label={recolhido ? t.abrirMenu : t.recolherMenu}
          title={recolhido ? t.abrirMenu : t.recolherMenu}
        >
          <Svg nome={recolhido ? "proximo" : "anterior"} tamanho={16} />
        </button>

        <nav aria-label={t.areaDoVoluntario}>
          {grupos.map((grupo) => (
            <div key={grupo} className="painel-menu-grupo">
              <span className="painel-menu-rotulo">{t.grupos[grupo] ?? grupo}</span>
              <ul>
                {NAVEGACAO.filter((item) => item.grupo === grupo).map((item) => (
                  <li key={item.caminho}>
                    <NavLink
                      to={item.caminho}
                      end={item.caminho === "/voluntario"}
                      className={({ isActive }) => (isActive ? "painel-item painel-item-atual" : "painel-item")}
                      title={recolhido ? (t.menu[item.icone] ?? item.nome) : undefined}
                    >
                      <Svg nome={item.icone} />
                      <span className="painel-item-texto">{t.menu[item.icone] ?? item.nome}</span>
                      {item.icone === "atendimentos" && painel.futuros.length > 0 && (
                        <span className="painel-contador" aria-label={t.proximosAria(painel.futuros.length)}>
                          {painel.futuros.length}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="painel-usuario">
          <Avatar nome={perfil.nome} foto={perfil.foto} className="painel-avatar">
            {/* bolinha: verde quando aparece na busca, cinza quando está pausado */}
            <span className={naBusca ? "painel-status painel-status-ativo" : "painel-status"}></span>
          </Avatar>
          <span className="painel-usuario-nome">
            <strong>{perfil.nome}</strong>
            <small>{naBusca ? t.naBusca : t.pausado}</small>
          </span>
          <button type="button" className="painel-sair" onClick={painel.sair} aria-label={t.sair} title={t.sair}>
            <Svg nome="sair" />
          </button>
        </div>
      </aside>

      <main className="painel-conteudo">
        <div className="painel-topo">
          <SeletorIdioma />
        </div>
        <Outlet context={painel} />
      </main>
    </div>
  );
}
