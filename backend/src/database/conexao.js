const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { DB_PATH } = require("../config/env");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

// o usuário passou a falar mais de um idioma: banco criado antes ganha a coluna nova sem precisar do db:reset
const colunas = db.prepare("SELECT name FROM pragma_table_info('usuarios')").all().map((c) => c.name);
if (colunas.includes("idioma") && !colunas.includes("idiomas")) {
  db.exec("ALTER TABLE usuarios RENAME COLUMN idioma TO idiomas");
}

module.exports = db;
