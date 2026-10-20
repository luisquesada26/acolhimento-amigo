import { useState } from "react";

export function Logo({ claro = false }) {
  const fundo = claro ? "#FFFFFF" : "#1757D8";
  const frente = claro ? "#1757D8" : "#FFFFFF";
  return (
    <span className={`logo ${claro ? "logo-claro" : ""}`}>
      <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="20" fill={fundo} />
        <path d="M10.5 13.5a5 5 0 0 1 5-5h9a5 5 0 0 1 5 5v6.5a5 5 0 0 1-5 5h-5l-5.2 4.2v-4.4a5 5 0 0 1-3.8-4.8z" fill={frente} />
        <path d="M20 21.4s-4.3-2.5-4.3-5.4a2.3 2.3 0 0 1 4.3-1.2a2.3 2.3 0 0 1 4.3 1.2c0 2.9-4.3 5.4-4.3 5.4z" fill={fundo} />
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
            aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
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
  return (
    <form className="formulario" onSubmit={form.enviar} noValidate>
      <Aviso texto={form.mensagem} />
      <Campo
        id={`${prefixo}-email`}
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@email.com"
        value={form.email}
        onChange={(e) => form.setEmail(e.target.value)}
        erro={form.erros.email}
      />
      <Campo
        id={`${prefixo}-senha`}
        rotulo="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="Sua senha"
        value={form.senha}
        onChange={(e) => form.setSenha(e.target.value)}
        erro={form.erros.senha}
      />
      <button type="submit" className="botao botao-primario" disabled={form.enviando}>
        {form.enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export const PERFIS = [
  { id: "usuario", titulo: "Preciso de atendimento", texto: "Sou migrante ou refugiado e quero marcar um atendimento." },
  { id: "voluntario", titulo: "Quero ser voluntário", texto: "Sou profissional e quero atender no meu tempo livre." },
];

export function EscolhaPerfil({ perfil, aoEscolher, prefixo }) {
  return (
    <fieldset className="escolha-perfil">
      <legend>Tipo de conta</legend>
      <div className="perfis">
        {PERFIS.map((p) => (
          <label key={p.id} className={`perfil-cartao perfil-${p.id}`}>
            <input
              type="radio"
              name={`${prefixo}-perfil`}
              value={p.id}
              checked={perfil === p.id}
              onChange={() => aoEscolher(p.id)}
            />
            <strong>{p.titulo}</strong>
            <span>{p.texto}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FormCadastro({ form, prefixo = "cadastro", mostrarEscolha = true }) {
  const ehVoluntario = form.perfil === "voluntario";

  return (
    <form className="formulario" onSubmit={form.enviar} noValidate>
      {mostrarEscolha && <EscolhaPerfil perfil={form.perfil} aoEscolher={form.setPerfil} prefixo={prefixo} />}
      <Aviso texto={form.mensagem} />

      <div className="grade-campos">
        <Campo
          id={`${prefixo}-nome`}
          rotulo="Nome completo"
          autoComplete="name"
          placeholder="Como você se chama?"
          value={form.dados.nome}
          onChange={(e) => form.mudar("nome", e.target.value)}
          erro={form.erros.nome}
        />
        <Campo
          id={`${prefixo}-email`}
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={form.dados.email}
          onChange={(e) => form.mudar("email", e.target.value)}
          erro={form.erros.email}
        />
        <Campo
          id={`${prefixo}-senha`}
          rotulo="Senha"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 6 caracteres"
          value={form.dados.senha}
          onChange={(e) => form.mudar("senha", e.target.value)}
          erro={form.erros.senha}
        />
        <Campo
          id={`${prefixo}-telefone`}
          rotulo="Telefone ou WhatsApp (opcional)"
          type="tel"
          autoComplete="tel"
          placeholder="(11) 90000-0000"
          value={form.dados.telefone}
          onChange={(e) => form.mudar("telefone", e.target.value)}
          erro={form.erros.telefone}
        />
      </div>

      {ehVoluntario && (
        <div className="bloco-voluntario">
          <div className="campo">
            <label htmlFor={`${prefixo}-area`}>Área de atuação</label>
            <select
              id={`${prefixo}-area`}
              value={form.areaId}
              onChange={(e) => form.setAreaId(e.target.value)}
              aria-invalid={Boolean(form.erros["voluntario.area_id"])}
            >
              <option value="">Escolha sua área</option>
              {form.areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
            {form.erros["voluntario.area_id"] && <span className="campo-erro">{form.erros["voluntario.area_id"]}</span>}
          </div>
          <p className="dica">Idiomas, serviços e agenda você completa depois de entrar.</p>
        </div>
      )}

      <div className="campo">
        <label className="aceite">
          <input type="checkbox" checked={form.aceite} onChange={(e) => form.setAceite(e.target.checked)} />
          <span>
            Li e aceito os termos de privacidade. Meus dados são usados só para o atendimento, de acordo com a LGPD.
          </span>
        </label>
        {form.erros.aceite_lgpd && <span className="campo-erro">{form.erros.aceite_lgpd}</span>}
      </div>

      <button type="submit" className="botao botao-primario" disabled={form.enviando}>
        {form.enviando ? "Criando conta..." : ehVoluntario ? "Criar conta de voluntário" : "Criar minha conta"}
      </button>
    </form>
  );
}
