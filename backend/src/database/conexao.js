const { AsyncLocalStorage } = require("async_hooks");
const { Pool } = require("pg");
const { DATABASE_URL } = require("../config/env");

function ehLocal(url) {
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

// a URL que o Supabase e o Vercel mostram pode vir com ?sslmode=require&supa=...&pgbouncer=...
// Esses parâmetros saem: com sslmode=require o pg exige certificado verificado, e o do Supabase não passa
function semParametrosDoSupabase(url) {
  try {
    const endereco = new URL(url);
    for (const parametro of ["sslmode", "supa", "pgbouncer"]) endereco.searchParams.delete(parametro);
    return endereco.toString();
  } catch {
    return url;
  }
}

const URL_DO_BANCO = DATABASE_URL && semParametrosDoSupabase(DATABASE_URL);

// o Supabase exige SSL; o Postgres da própria máquina, não
const pool = new Pool({
  connectionString: URL_DO_BANCO,
  ssl: URL_DO_BANCO && !ehLocal(URL_DO_BANCO) ? { rejectUnauthorized: false } : false,
});

// conexão parada que o servidor fechou: só registra, sem derrubar a API
pool.on("error", (erro) => console.error("Conexão com o banco caiu:", erro.message));

// guarda o cliente da transação em andamento: as consultas de dentro dela vão pela mesma conexão
const emTransacao = new AsyncLocalStorage();

// os repositories escrevem ? (ou @nome, com um objeto) como no SQLite; o pg espera $1, $2...
function paraPostgres(sql, params) {
  if (Array.isArray(params)) {
    let i = 0;
    return [sql.replace(/\?/g, () => `$${++i}`), params];
  }

  const valores = [];
  const posicoes = {};
  const texto = sql.replace(/@(\w+)/g, (_, nome) => {
    if (!(nome in posicoes)) {
      valores.push(params[nome]);
      posicoes[nome] = valores.length;
    }
    return `$${posicoes[nome]}`;
  });
  return [texto, valores];
}

function consulta(sql, params = []) {
  const [texto, valores] = paraPostgres(sql, params);
  return (emTransacao.getStore() ?? pool).query(texto, valores);
}

// tudo o que fn fizer no banco vale junto, ou nada vale
async function transacao(fn) {
  if (emTransacao.getStore()) return fn();

  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await emTransacao.run(cliente, fn);
    await cliente.query("COMMIT");
    return resultado;
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw erro;
  } finally {
    cliente.release();
  }
}

module.exports = { pool, consulta, transacao };
