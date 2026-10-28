import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../login/Campos";
import SeletorIdioma from "../../components/SeletorIdioma";
import Avatar from "../../components/Avatar";
import { perfilCompleto, useAuth } from "../../context/AuthContext";
import { Svg } from "../voluntario/comum";
import "./usuario.css";

const COMPLETAR = "/usuario/completar";

// barra de cima das telas de quem pede atendimento
export default function LayoutUsuario() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const completo = perfilCompleto(usuario);

  // primeiro acesso: antes de qualquer tela, completar o perfil
  if (!completo && pathname !== COMPLETAR) return <Navigate to={COMPLETAR} replace />;
  if (completo && pathname === COMPLETAR) return <Navigate to="/usuario" replace />;

  function deslogar() {
    sair();
    navigate("/login");
  }

  return (
    <div className="usu">
      <header className="usu-topo">
        <Link to="/usuario" className="usu-logo" aria-label="Acolhimento Amigo, ir para a busca">
          <Logo />
        </Link>

        <div className="usu-acoes">
          <SeletorIdioma />
          {completo ? (
            <NavLink to="/usuario/perfil" className={({ isActive }) => (isActive ? "usu-pessoa usu-pessoa-atual" : "usu-pessoa")} title="Meu perfil">
              <Avatar nome={usuario.nome} foto={usuario.foto} className="usu-avatar" />
              <span className="usu-pessoa-texto">
                <span className="usu-pessoa-nome">{usuario.nome}</span>
                <small>Meu perfil</small>
              </span>
            </NavLink>
          ) : (
            <span className="usu-pessoa">
              <Avatar nome={usuario.nome} foto={usuario.foto} className="usu-avatar" />
              <span className="usu-pessoa-nome">{usuario.nome}</span>
            </span>
          )}
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
