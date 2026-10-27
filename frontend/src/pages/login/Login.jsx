import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FormCadastro, FormEntrar, Logo } from "./Campos";
import SeletorIdioma from "../../components/SeletorIdioma";
import { LANG, useIdioma, useTextos } from "../../context/IdiomaContext";
import { useCadastro, useEntrar } from "./useFormularios";
import { traducoes } from "./traducoes";
import "./login.css";

export default function Login() {
  const [params] = useSearchParams();
  const [modo, setModo] = useState(params.get("modo") === "cadastro" ? "cadastro" : "entrar");
  const entrar = useEntrar();
  const cadastro = useCadastro(
    params.get("perfil") === "voluntario" ? "voluntario" : "usuario"
  );
  const { idioma } = useIdioma();
  const t = useTextos(traducoes);
  const ehEntrar = modo === "entrar";

  return (
    <main className="login" lang={LANG[idioma]}>
      <div className="login-topo">
        <Link to="/" className="login-voltar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t.voltarAoSite}
        </Link>
        <SeletorIdioma claro />
      </div>
      <Link to="/" className="login-logo" aria-label={t.logoInicio}>
        <Logo claro />
      </Link>
      <section className={ehEntrar ? "cartao" : "cartao cartao-cadastro"} aria-labelledby="login-titulo">
        <header className="cabecalho-form">
          <h1 id="login-titulo">{ehEntrar ? t.entrarTitulo : t.cadastroTitulo}</h1>
          <p>{ehEntrar ? t.entrarSubtitulo : t.cadastroSubtitulo}</p>
        </header>

        {ehEntrar ? <FormEntrar form={entrar} /> : <FormCadastro form={cadastro} />}

        <p className="trocar">
          {ehEntrar ? t.semConta : t.temConta}{" "}
          <button type="button" className="link" onClick={() => setModo(ehEntrar ? "cadastro" : "entrar")}>
            {ehEntrar ? t.criarConta : t.entrar}
          </button>
        </p>
      </section>
      <p className="rodape">{t.rodape}</p>
    </main>
  );
}
