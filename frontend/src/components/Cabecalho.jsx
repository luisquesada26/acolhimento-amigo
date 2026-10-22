
import { Link } from "react-router-dom";
import { APP_NAME } from "../config";
import "./Cabecalho.css";

export default function Cabecalho({ t }) {
  return (
    <header className="cabecalho">
      <Link
        to="/"
        className="cabecalho-logo"
        aria-label={`${APP_NAME} - Início`}
      >
        <img
          src="/images/logo.svg"
          alt={APP_NAME}
          className="cabecalho-logo-imagem"
        />
      </Link>

      <nav
        className="cabecalho-navegacao"
        aria-label="Navegação principal"
      >
        <a href="#inicio">{t.navInicio}</a>
        <a href="#servicos">{t.navServicos}</a>

        <Link to="/login?modo=cadastro&perfil=voluntario">
          {t.navVoluntario}
        </Link>

        <a href="#sobre">{t.navSobre}</a>
      </nav>

      <Link to="/login" className="cabecalho-botao">
        {t.entrar}
      </Link>
    </header>
  );
}
