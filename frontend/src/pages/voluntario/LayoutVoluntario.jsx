import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Logo } from "../login/Campos";
import ConviteInstalar from "../../components/ConviteInstalar";
import RodapeApp from "../../components/RodapeApp";
import { useInstalarApp } from "../../components/useInstalarApp";
import { LANG, useIdioma, useTextos } from "../../context/IdiomaContext";
import { traduzirErroApi } from "../../services/errosApi";
import usePainel from "./usePainel";
import BarraTopo from "./BarraTopo";
import { NAVEGACAO, Svg } from "./comum";
import { traducoes } from "./traducoes";
import "./painel.css";
import "./paginas.css";
import "./layout.css";

const CHAVE_MENU = "acolhimento:menu-recolhido";

function lerMenuRecolhido() {
  try {
    return localStorage.getItem(CHAVE_MENU) === "sim";
  } catch {
    return false;
  }
}

// menu lateral e barra de cima das telas do voluntário; os dados carregam aqui e as telas recebem pelo Outlet
export default function LayoutVoluntario() {
  const painel = usePainel();
  const [recolhido, setRecolhido] = useState(lerMenuRecolhido);
  const { idioma } = useIdioma();
  const t = useTextos(traducoes);
  const app = useInstalarApp();

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
          {traduzirErroApi(painel.erro)}
        </p>
        <button type="button" className="botao botao-primario" onClick={painel.recarregar}>
          {t.tentarDeNovo}
        </button>
      </main>
    );
  }

  const { perfil } = painel;
  const grupos = [...new Set(NAVEGACAO.map((item) => item.grupo))];

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
              <span className="painel-menu-rotulo">{t.grupos[grupo]}</span>
              <ul>
                {NAVEGACAO.filter((item) => item.grupo === grupo).map((item) => (
                  <li key={item.caminho}>
                    <NavLink
                      to={item.caminho}
                      end={item.caminho === "/voluntario"}
                      className={({ isActive }) => (isActive ? "painel-item painel-item-atual" : "painel-item")}
                      title={recolhido ? t.menu[item.icone] : undefined}
                    >
                      <Svg nome={item.icone} />
                      <span className="painel-item-texto">{t.menu[item.icone]}</span>
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
      </aside>

      <div className="painel-coluna">
        <BarraTopo perfil={perfil} sair={painel.sair} app={app} />
        <main className="painel-conteudo">
          <ConviteInstalar app={app} />
          <Outlet context={painel} />
        </main>
        <RodapeApp />
      </div>
    </div>
  );
}
