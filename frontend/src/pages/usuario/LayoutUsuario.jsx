import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../login/Campos";
import SeletorIdioma from "../../components/SeletorIdioma";
import Avatar from "../../components/Avatar";
import { perfilCompleto, useAuth } from "../../context/AuthContext";
import { LANG, useIdioma, useTextos } from "../../context/IdiomaContext";
import { Svg } from "../voluntario/comum";
import { traducoes } from "./traducoes";
import "./usuario.css";

const COMPLETAR = "/usuario/completar";

// barra de cima das telas de quem pede atendimento
export default function LayoutUsuario() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const completo = perfilCompleto(usuario);
  const { idioma } = useIdioma();
  const t = useTextos(traducoes);

  // primeiro acesso: antes de qualquer tela, completar o perfil
  if (!completo && pathname !== COMPLETAR) return <Navigate to={COMPLETAR} replace />;
  if (completo && pathname === COMPLETAR) return <Navigate to="/usuario" replace />;

  function deslogar() {
    sair();
    navigate("/login");
  }

  return (
    <div className="usu" lang={LANG[idioma]}>
      <header className="usu-topo">
        <Link to="/usuario" className="usu-logo" aria-label={t.logoBusca}>
          <Logo />
        </Link>

        {completo && (
          <nav className="usu-navegacao" aria-label={t.navegacao}>
            <NavLink to="/usuario" end className={({ isActive }) => (isActive ? "usu-nav usu-nav-atual" : "usu-nav")}>
              <Svg nome="busca" tamanho={17} /> {t.navBuscar}
            </NavLink>
            <NavLink to="/usuario/atendimentos" className={({ isActive }) => (isActive ? "usu-nav usu-nav-atual" : "usu-nav")}>
              <Svg nome="agenda" tamanho={17} /> {t.navAtendimentos}
            </NavLink>
          </nav>
        )}

        <div className="usu-acoes">
          <SeletorIdioma />
          {completo ? (
            <NavLink to="/usuario/perfil" className={({ isActive }) => (isActive ? "usu-pessoa usu-pessoa-atual" : "usu-pessoa")} title={t.meuPerfil}>
              <Avatar nome={usuario.nome} foto={usuario.foto} className="usu-avatar" />
              <span className="usu-pessoa-texto">
                <span className="usu-pessoa-nome">{usuario.nome}</span>
                <small>{t.meuPerfil}</small>
              </span>
            </NavLink>
          ) : (
            <span className="usu-pessoa">
              <Avatar nome={usuario.nome} foto={usuario.foto} className="usu-avatar" />
              <span className="usu-pessoa-nome">{usuario.nome}</span>
            </span>
          )}
          <button type="button" className="usu-sair" onClick={deslogar} aria-label={t.sair} title={t.sair}>
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
