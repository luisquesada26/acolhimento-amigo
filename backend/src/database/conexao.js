const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { DB_PATH } = require("../config/env");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

// banco criado antes ganha as colunas novas de usuarios sem precisar do db:reset
const colunas = db.prepare("SELECT name FROM pragma_table_info('usuarios')").all().map((c) => c.name);
if (colunas.length) {
  // o usuário passou a falar mais de um idioma
  if (colunas.includes("idioma") && !colunas.includes("idiomas")) {
    db.exec("ALTER TABLE usuarios RENAME COLUMN idioma TO idiomas");
  }
  // endereço, todo opcional
  for (const coluna of ["cep", "rua", "numero", "complemento", "bairro", "cidade", "estado"]) {
    if (!colunas.includes(coluna)) db.exec(`ALTER TABLE usuarios ADD COLUMN ${coluna} TEXT`);
  }
}

module.exports = db;
