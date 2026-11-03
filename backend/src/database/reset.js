const fs = require("fs");
const path = require("path");
const { pool, consulta, transacao } = require("./conexao");
const seed = require("./seed");
const { DATABASE_URL } = require("../config/env");

if (!DATABASE_URL) {
  console.error("Falta a DATABASE_URL no backend/.env (o endereço do Postgres, veja o README)");
  process.exit(1);
}

const TABELAS = ["usuarios", "areas", "voluntarios", "servicos", "horarios", "agendamentos"];

// tudo numa transação: se algo falhar no meio, o banco continua como estava
async function resetar() {
  await transacao(async () => {
    const { rows } = await consulta("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    for (const { tablename } of rows) {
      await consulta(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
    }

    await consulta(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
    await seed();
  });

  // o endereço sem o usuário e a senha
  const { host, pathname } = new URL(DATABASE_URL);
  console.log(`Banco recriado em ${host}${pathname}`);
  for (const tabela of TABELAS) {
    const { rows } = await consulta(`SELECT COUNT(*)::int AS total FROM ${tabela}`);
    console.log(`  ${tabela}: ${rows[0].total}`);
  }
}

resetar()
  .catch((erro) => {
    console.error("Não foi possível recriar o banco:", erro.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
