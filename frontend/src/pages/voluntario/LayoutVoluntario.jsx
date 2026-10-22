import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Logo } from "../login/Campos";
import SeletorIdioma from "../../components/SeletorIdioma";
import Avatar from "../../components/Avatar";
import usePainel from "./usePainel";
import { NAVEGACAO, Svg } from "./comum";
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
      <main className="painel-estado">
        <p>Carregando seu painel...</p>
      </main>
    );
  }

  if (painel.erro) {
    return (
      <main className="painel-estado">
        <p className="aviso" role="alert">
          {painel.erro}
        </p>
        <button type="button" className="botao botao-primario" onClick={painel.recarregar}>
          Tentar de novo
        </button>
      </main>
    );
  }

  const { perfil } = painel;
  const grupos = [...new Set(NAVEGACAO.map((item) => item.grupo))];
  const naBusca = perfil.voluntario.ativo;

  return (
    <div className={recolhido ? "painel painel-recolhido" : "painel"}>
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
          aria-label={recolhido ? "Abrir o menu" : "Recolher o menu"}
          title={recolhido ? "Abrir o menu" : "Recolher o menu"}
        >
          <Svg nome={recolhido ? "proximo" : "anterior"} tamanho={16} />
        </button>

        <nav aria-label="Área do voluntário">
          {grupos.map((grupo) => (
            <div key={grupo} className="painel-menu-grupo">
              <span className="painel-menu-rotulo">{grupo}</span>
              <ul>
                {NAVEGACAO.filter((item) => item.grupo === grupo).map((item) => (
                  <li key={item.caminho}>
                    <NavLink
                      to={item.caminho}
                      end={item.caminho === "/voluntario"}
                      className={({ isActive }) => (isActive ? "painel-item painel-item-atual" : "painel-item")}
                      title={recolhido ? item.nome : undefined}
                    >
                      <Svg nome={item.icone} />
                      <span className="painel-item-texto">{item.nome}</span>
                      {item.icone === "atendimentos" && painel.futuros.length > 0 && (
                        <span className="painel-contador" aria-label={`${painel.futuros.length} próximos`}>
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
            <small>{naBusca ? "Na busca" : "Pausado"}</small>
          </span>
          <button type="button" className="painel-sair" onClick={painel.sair} aria-label="Sair" title="Sair">
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
