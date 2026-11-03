// autoriza a conta do projeto no Google uma vez e guarda o refresh token no backend/.env
// uso: npm run google:autorizar (na pasta backend), logado no navegador com acolhimentoamigo@gmail.com
// no modo de teste do Google a autorização vence em 7 dias: é só rodar de novo
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const { exec } = require("child_process");

const ARQUIVO_ENV = process.argv[2];
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
const ESCOPOS = ["openid", "email", "https://www.googleapis.com/auth/calendar.events"];

if (!ARQUIVO_ENV || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("Falta GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET no .env");
  process.exit(1);
}

const base64url = (buffer) => buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const verificador = base64url(crypto.randomBytes(32));
const desafio = base64url(crypto.createHash("sha256").update(verificador).digest());

function gravarNoEnv(chave, valor) {
  let env = fs.readFileSync(ARQUIVO_ENV, "utf8");
  const linha = `${chave}=${valor}`;
  const regra = new RegExp(`^${chave}=.*$`, "m");
  env = regra.test(env) ? env.replace(regra, linha) : `${env.replace(/\s*$/, "")}\n${linha}\n`;
  fs.writeFileSync(ARQUIVO_ENV, env);
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (!url.searchParams.has("code") && !url.searchParams.has("error")) {
    res.writeHead(404).end();
    return;
  }
  const responder = (texto) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!doctype html><meta charset="utf-8"><title>Acolhimento Amigo</title><body style="font-family:sans-serif;padding:40px"><h1>${texto}</h1><p>Pode fechar esta aba.</p></body>`);
  };

  if (url.searchParams.has("error")) {
    responder("A autorização não foi concluída.");
    console.error("O Google respondeu:", url.searchParams.get("error"));
    servidor.close();
    process.exitCode = 1;
    return;
  }

  try {
    const resposta = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: url.searchParams.get("code"),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `http://127.0.0.1:${servidor.address().port}`,
        grant_type: "authorization_code",
        code_verifier: verificador,
      }),
    });
    const dados = await resposta.json();
    if (!resposta.ok || !dados.refresh_token) {
      throw new Error(dados.error_description || dados.error || "o Google não devolveu o refresh token");
    }
    // a caixa da agenda vem desmarcada na tela do Google; sem ela a autorização não serve
    if (!String(dados.scope).includes("calendar.events")) {
      responder("Faltou marcar a caixa da agenda. Rode o comando de novo e marque “Ver y editar eventos”.");
      console.error("erro: a permissão da agenda não foi marcada; nada foi gravado");
      process.exitCode = 1;
      return;
    }

    // o id_token diz qual conta autorizou; só o e-mail é mostrado
    const conta = JSON.parse(Buffer.from(dados.id_token.split(".")[1], "base64").toString()).email;
    gravarNoEnv("GOOGLE_REFRESH_TOKEN", dados.refresh_token);

    // confere que a agenda responde com essa autorização
    const agenda = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1", {
      headers: { Authorization: `Bearer ${dados.access_token}` },
    });
    responder("Pronto, a conta do Acolhimento Amigo foi autorizada.");
    console.log(`ok: conta autorizada ${conta} | agenda respondeu ${agenda.status} | GOOGLE_REFRESH_TOKEN gravado no .env`);
  } catch (erro) {
    responder("Deu erro ao guardar a autorização.");
    console.error("erro:", erro.message);
    process.exitCode = 1;
  } finally {
    servidor.close();
  }
});

servidor.listen(0, "127.0.0.1", () => {
  const parametros = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `http://127.0.0.1:${servidor.address().port}`,
    response_type: "code",
    scope: ESCOPOS.join(" "),
    access_type: "offline",
    prompt: "consent",
    login_hint: "acolhimentoamigo@gmail.com",
    code_challenge: desafio,
    code_challenge_method: "S256",
  });
  const endereco = `https://accounts.google.com/o/oauth2/v2/auth?${parametros}`;
  console.log("Abrindo o navegador para autorizar...");
  exec(process.platform === "win32" ? `start "" "${endereco}"` : `xdg-open "${endereco}"`);
  console.log(`Se o navegador não abrir, copie este endereço:
${endereco}`);
});

// desiste depois de 10 minutos
setTimeout(() => {
  console.error("Passaram 10 minutos sem autorização. Rode de novo.");
  process.exit(1);
}, 10 * 60 * 1000).unref();
