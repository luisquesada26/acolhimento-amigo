import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "../login/Campos";
import SeletorIdioma from "../../components/SeletorIdioma";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { Svg } from "../voluntario/comum";
import "./usuario.css";

// por enquanto só a busca; "Meus atendimentos" e "Meu perfil" entram aqui depois
const NAVEGACAO = [{ nome: "Buscar voluntários", icone: "busca", caminho: "/usuario" }];

// barra de cima das telas de quem pede atendimento
export default function LayoutUsuario() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  function deslogar() {
    sair();
    navigate("/login");
  }

  return (
    <div className="usu">
      <header className="usu-topo">
        <Logo />

        <nav className="usu-navegacao" aria-label="Área de quem pede atendimento">
          {NAVEGACAO.map((item) => (
            <NavLink
              key={item.caminho}
              to={item.caminho}
              end
              className={({ isActive }) => (isActive ? "usu-item usu-item-atual" : "usu-item")}
            >
              <Svg nome={item.icone} tamanho={18} />
              <span>{item.nome}</span>
            </NavLink>
          ))}
        </nav>

        <div className="usu-acoes">
          <SeletorIdioma />
          <span className="usu-pessoa">
            <Avatar nome={usuario.nome} foto={usuario.foto} className="usu-avatar" />
            <span className="usu-pessoa-nome">{usuario.nome}</span>
          </span>
          <button type="button" className="usu-sair" onClick={deslogar} aria-label="Sair" title="Sair">
            <Svg nome="sair" tamanho={18} />
          </button>
        </div>
      </header>

      <main className="usu-conteudo">
        <Outlet />
      </main>
    </div>
  );
}
