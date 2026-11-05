import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../login/Campos";
import SeletorIdioma from "../../components/SeletorIdioma";
import Avatar from "../../components/Avatar";
import ConviteInstalar from "../../components/ConviteInstalar";
import RodapeApp from "../../components/RodapeApp";
import { useInstalarApp } from "../../components/useInstalarApp";
import { perfilCompleto, useAuth } from "../../context/AuthContext";
import { LANG, useIdioma, useTextos } from "../../context/IdiomaContext";
import { Svg } from "../voluntario/comum";
import BotaoAtendimentos from "./PainelAtendimentos";
import { AtendimentosProvider } from "./useAtendimentos";
import { AreaComPassos, PassosProvider, TrocaOpcao } from "./PrimeiroAcesso";
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
  const app = useInstalarApp();

  // primeiro acesso: antes de qualquer tela, completar o perfil
  if (!completo && pathname !== COMPLETAR) return <Navigate to={COMPLETAR} replace />;
  if (completo && pathname === COMPLETAR) return <Navigate to="/usuario" replace />;

  function deslogar() {
    sair();
    navigate("/login");
  }

  return (
    <AtendimentosProvider ativo={completo}>
      <div className="usu" lang={LANG[idioma]}>
        <header className="usu-topo">
          <Link to="/usuario" className="usu-logo" aria-label={t.logoBusca}>
            <Logo />
          </Link>

          {/* a busca fica no logo; meus atendimentos abre por cima da tela atual */}
          {completo && (
            <nav className="usu-navegacao" aria-label={t.navegacao}>
              <BotaoAtendimentos />
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

        <PassosProvider>
          <AreaComPassos topo={<ConviteInstalar app={app} />}>
            <Outlet />
          </AreaComPassos>
          <RodapeApp />
          <TrocaOpcao />
        </PassosProvider>
      </div>
    </AtendimentosProvider>
  );
}
