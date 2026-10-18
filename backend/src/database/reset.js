const fs = require("fs");
const path = require("path");
const db = require("./conexao");
const seed = require("./seed");
const { DB_PATH } = require("../config/env");

// apaga as tabelas em vez do arquivo, porque no Windows o .db fica travado se o servidor estiver rodando
const tabelas = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
  .all();

db.pragma("foreign_keys = OFF");
for (const { name } of tabelas) {
  db.exec(`DROP TABLE IF EXISTS "${name}"`);
}
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
db.exec(schema);
seed(db);

const contar = (tabela) => db.prepare(`SELECT COUNT(*) AS total FROM ${tabela}`).get().total;

console.log("Banco recriado em", DB_PATH);
for (const tabela of ["usuarios", "areas", "voluntarios", "servicos", "horarios", "agendamentos"]) {
  console.log(`  ${tabela}: ${contar(tabela)}`);
}

db.close();
