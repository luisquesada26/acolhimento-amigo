import { useState } from "react";
import SeletorArea from "../../components/SeletorArea";
import { useTextos } from "../../context/IdiomaContext";
import { traducoes } from "./traducoes";

// erro de validação vem como chave (emailInvalido...); o que vem da API e não tem tradução aparece como veio
function useErros() {
  const t = useTextos(traducoes);
  return (valor) => (valor ? t.erros[valor] ?? valor : valor);
}

export function Logo({ claro = false }) {
  const fundo = claro ? "#FFFFFF" : "#1757D8";
  const frente = claro ? "#1757D8" : "#FFFFFF";
  return (
    <span className={`logo ${claro ? "logo-claro" : ""}`}>
      <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="20" fill={fundo} />
        <path d="M8 15.4a6.2 6.2 0 0 1 6.2-6.2h11.6a6.2 6.2 0 0 1 6.2 6.2v8a6.2 6.2 0 0 1-6.2 6.2h-6.2l-6.4 5.2v-5.4a6.2 6.2 0 0 1-5.2-6z" fill={frente} />
        <path d="M20 26s-6.2-3.6-6.2-7.8a3.3 3.3 0 0 1 6.2-1.7a3.3 3.3 0 0 1 6.2 1.7c0 4.2-6.2 7.8-6.2 7.8z" fill={fundo} />
      </svg>
      <span className="logo-texto">
        <span>Acolhimento</span>
        <strong>Amigo</strong>
      </span>
    </span>
  );
}

function IconeOlho({ aberto }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {aberto ? (
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z" />
      ) : (
        <path d="M17.9 17.9A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9 M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2 M14.1 14.1a3 3 0 1 1-4.2-4.2 M1 1l22 22" />
      )}
    </svg>
  );
}

export function Campo({ id, rotulo, erro, type = "text", ...props }) {
  const t = useTextos(traducoes);
  const [verSenha, setVerSenha] = useState(false);
  const ehSenha = type === "password";

  const input = (
    <input
      id={id}
      type={ehSenha && verSenha ? "text" : type}
      aria-invalid={Boolean(erro)}
      aria-describedby={erro ? `${id}-erro` : undefined}
      {...props}
    />
  );

  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      {ehSenha ? (
        <div className="campo-senha">
          {input}
          <button
            type="button"
            className="ver-senha"
            aria-label={verSenha ? t.ocultarSenha : t.mostrarSenha}
            aria-pressed={verSenha}
            aria-controls={id}
            onClick={() => setVerSenha((atual) => !atual)}
          >
            <IconeOlho aberto={!verSenha} />
          </button>
        </div>
      ) : (
        input
      )}
      {erro && (
        <span id={`${id}-erro`} className="campo-erro">
          {erro}
        </span>
      )}
    </div>
  );
}

export function Aviso({ texto }) {
  if (!texto) return null;
  return (
    <p className="aviso" role="alert">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z M12 8v5 M12 16.5h.01" />
      </svg>
      {texto}
    </p>
  );
}

export function FormEntrar({ form, prefixo = "entrar" }) {
  const t = useTextos(traducoes);
  const traduzir = useErros();
  return (
    <form className="formulario" onSubmit={form.enviar} noValidate>
      <Aviso texto={traduzir(form.mensagem)} />
      <Campo
        id={`${prefixo}-email`}
        rotulo={t.email}
        type="email"
        autoComplete="email"
        placeholder={t.emailExemplo}
        value={form.email}
        onChange={(e) => form.setEmail(e.target.value)}
        erro={traduzir(form.erros.email)}
      />
      <Campo
        id={`${prefixo}-senha`}
        rotulo={t.senha}
        type="password"
        autoComplete="current-password"
        placeholder={t.suaSenha}
        value={form.senha}
        onChange={(e) => form.setSenha(e.target.value)}
        erro={traduzir(form.erros.senha)}
      />
      <button type="submit" className="botao botao-primario" disabled={form.enviando}>
        {form.enviando ? t.entrando : t.entrar}
      </button>
    </form>
  );
}

export const PERFIS = ["usuario", "voluntario"];

export function EscolhaPerfil({ perfil, aoEscolher, prefixo }) {
  const t = useTextos(traducoes);
  return (
    <fieldset className="escolha-perfil">
      <legend>{t.tipoDeConta}</legend>
      <div className="perfis">
        {PERFIS.map((id) => (
          <label key={id} className={`perfil-cartao perfil-${id}`}>
            <input
              type="radio"
              name={`${prefixo}-perfil`}
              value={id}
              checked={perfil === id}
              onChange={() => aoEscolher(id)}
            />
            <strong>{t.perfis[id].titulo}</strong>
            <span>{t.perfis[id].texto}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FormCadastro({ form, prefixo = "cadastro", mostrarEscolha = true }) {
  const t = useTextos(traducoes);
  const traduzir = useErros();
  const ehVoluntario = form.perfil === "voluntario";

  return (
    <form className="formulario" onSubmit={form.enviar} noValidate>
      {mostrarEscolha && <EscolhaPerfil perfil={form.perfil} aoEscolher={form.setPerfil} prefixo={prefixo} />}
      <Aviso texto={traduzir(form.mensagem)} />

      <div className="grade-campos">
        <Campo
          id={`${prefixo}-nome`}
          rotulo={t.nome}
          autoComplete="name"
          placeholder={t.nomeExemplo}
          value={form.dados.nome}
          onChange={(e) => form.mudar("nome", e.target.value)}
          erro={traduzir(form.erros.nome)}
        />
        <Campo
          id={`${prefixo}-email`}
          rotulo={t.email}
          type="email"
          autoComplete="email"
          placeholder={t.emailExemplo}
          value={form.dados.email}
          onChange={(e) => form.mudar("email", e.target.value)}
          erro={traduzir(form.erros.email)}
        />
        <Campo
          id={`${prefixo}-senha`}
          rotulo={t.senha}
          type="password"
          autoComplete="new-password"
          placeholder={t.senhaMinima}
          value={form.dados.senha}
          onChange={(e) => form.mudar("senha", e.target.value)}
          erro={traduzir(form.erros.senha)}
        />
        <Campo
          id={`${prefixo}-telefone`}
          rotulo={t.telefone}
          type="tel"
          autoComplete="tel"
          placeholder="(11) 90000-0000"
          value={form.dados.telefone}
          onChange={(e) => form.mudar("telefone", e.target.value)}
          erro={traduzir(form.erros.telefone)}
        />
      </div>

      {ehVoluntario && (
        <div className="bloco-voluntario">
          <SeletorArea
            id={`${prefixo}-area`}
            rotulo={t.area}
            textoVazio={t.escolhaArea}
            areas={form.areas}
            valor={form.areaId}
            aoEscolher={form.setAreaId}
            erro={traduzir(form.erros["voluntario.area_id"])}
          />
          <p className="dica">{t.dicaVoluntario}</p>
        </div>
      )}

      <div className="campo">
        <label className="aceite">
          <input type="checkbox" checked={form.aceite} onChange={(e) => form.setAceite(e.target.checked)} />
          <span>{t.aceite}</span>
        </label>
        {form.erros.aceite_lgpd && <span className="campo-erro">{traduzir(form.erros.aceite_lgpd)}</span>}
      </div>

      <button type="submit" className={`botao botao-primario ${ehVoluntario ? "botao-voluntario" : ""}`} disabled={form.enviando}>
        {form.enviando ? t.criandoConta : ehVoluntario ? t.criarContaVoluntario : t.criarMinhaConta}
      </button>
    </form>
  );
}
