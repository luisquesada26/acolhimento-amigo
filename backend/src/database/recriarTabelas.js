const fs = require("fs");
const path = require("path");
const { consulta } = require("./conexao");

const TABELAS = ["usuarios", "areas", "voluntarios", "servicos", "horarios", "agendamentos"];

// apaga todas as tabelas do schema public e cria de novo pelo schema.sql, vazias
async function recriarTabelas() {
  const { rows } = await consulta("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  for (const { tablename } of rows) {
    await consulta(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
  }
  await consulta(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
}

// o COUNT do Postgres vem como texto no pg: o ::int devolve número
async function contar(tabela) {
  return (await consulta(`SELECT COUNT(*)::int AS total FROM ${tabela}`)).rows[0].total;
}

module.exports = { TABELAS, recriarTabelas, contar };
