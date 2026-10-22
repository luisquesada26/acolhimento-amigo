import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FormCadastro, FormEntrar, Logo } from "./Campos";
import { useCadastro, useEntrar } from "./useFormularios";
import "./login.css";

export default function Login() {
  const [params] = useSearchParams();
  const [modo, setModo] = useState(params.get("modo") === "cadastro" ? "cadastro" : "entrar");
  const entrar = useEntrar();
  const cadastro = useCadastro(
    params.get("perfil") === "voluntario" ? "voluntario" : "usuario"
  );
  const ehEntrar = modo === "entrar";

  return (
    <main className="login">
      <Logo claro />
      <section className={ehEntrar ? "cartao" : "cartao cartao-cadastro"} aria-labelledby="login-titulo">
        <header className="cabecalho-form">
          <h1 id="login-titulo">{ehEntrar ? "Entre na sua conta" : "Crie sua conta grátis"}</h1>
          <p>{ehEntrar ? "Que bom te ver de novo." : "Leva menos de um minuto."}</p>
        </header>

        {ehEntrar ? <FormEntrar form={entrar} /> : <FormCadastro form={cadastro} />}

        <p className="trocar">
          {ehEntrar ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
          <button type="button" className="link" onClick={() => setModo(ehEntrar ? "cadastro" : "entrar")}>
            {ehEntrar ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </section>
      <p className="rodape">Atendimento gratuito para migrantes e refugiados.</p>
    </main>
  );
}
