// copia os dados do banco SQLite de antes para o Postgres da DATABASE_URL, com os mesmos ids
// uso (na pasta backend): npm run db:copiar-sqlite              lê ./data/acolhimento.db
//                         npm run db:copiar-sqlite -- outro.db  caminho a partir da pasta backend
// ATENÇÃO: apaga as tabelas do Postgres antes de copiar. O SQLite só é lido, nunca alterado
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { pool, consulta, transacao } = require("../src/database/conexao");
const { TABELAS, recriarTabelas, contar } = require("../src/database/recriarTabelas");
const { DATABASE_URL } = require("../src/config/env");

// linhas por INSERT: uma por vez seria lento no Supabase, onde cada ida ao banco demora
const LOTE = 200;

if (!DATABASE_URL) {
  console.error("Falta a DATABASE_URL no backend/.env (o endereço do Postgres, veja o README)");
  process.exit(1);
}

const arquivo = path.resolve(__dirname, "..", process.argv[2] || "data/acolhimento.db");
if (!fs.existsSync(arquivo)) {
  console.error(`Não achei o banco SQLite em ${arquivo}`);
  process.exit(1);
}

const sqlite = new DatabaseSync(arquivo, { readOnly: true });

const colunasNoSqlite = (tabela) => sqlite.prepare(`SELECT name FROM pragma_table_info('${tabela}')`).all().map((c) => c.name);

async function copiarTabela(tabela) {
  const noSqlite = colunasNoSqlite(tabela);
  const { fields } = await consulta(`SELECT * FROM ${tabela} LIMIT 0`);
  const colunas = fields.map((f) => f.name);

  // coluna que só o SQLite tem perderia dados: melhor parar e avisar
  const sobrando = noSqlite.filter((c) => !colunas.includes(c));
  if (sobrando.length) throw new Error(`a tabela ${tabela} do SQLite tem colunas que o Postgres não tem: ${sobrando.join(", ")}`);
  const copiadas = colunas.filter((c) => noSqlite.includes(c));

  const linhas = sqlite.prepare(`SELECT ${copiadas.join(", ")} FROM ${tabela} ORDER BY id`).all();
  for (let i = 0; i < linhas.length; i += LOTE) {
    const lote = linhas.slice(i, i + LOTE);
    const valores = lote.map(() => `(${copiadas.map(() => "?").join(", ")})`).join(", ");
    await consulta(
      `INSERT INTO ${tabela} (${copiadas.join(", ")}) VALUES ${valores}`,
      lote.flatMap((linha) => copiadas.map((c) => linha[c]))
    );
  }

  // o próximo id novo continua depois do maior id copiado (sem isso, o próximo INSERT repetiria um id)
  await consulta(`SELECT setval(pg_get_serial_sequence('${tabela}', 'id'), COALESCE((SELECT MAX(id) FROM ${tabela}), 0) + 1, false)`);
}

async function copiar() {
  const outras = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((t) => t.name)
    .filter((t) => !TABELAS.includes(t));
  if (outras.length) console.log(`Tabelas do SQLite que não existem no Postgres e ficam de fora: ${outras.join(", ")}`);

  // tudo numa transação: se algo falhar no meio, o Postgres continua como estava
  // a ordem das TABELAS respeita as chaves estrangeiras (quem é apontado entra antes)
  await transacao(async () => {
    await recriarTabelas();
    for (const tabela of TABELAS) await copiarTabela(tabela);
  });

  console.log(`Copiado de ${arquivo} para o Postgres da DATABASE_URL`);
  let diferente = false;
  for (const tabela of TABELAS) {
    const origem = sqlite.prepare(`SELECT COUNT(*) AS total FROM ${tabela}`).get().total;
    const destino = await contar(tabela);
    if (origem !== destino) diferente = true;
    console.log(`  ${tabela}: SQLite ${origem}, Postgres ${destino}${origem === destino ? "" : "  <- DIFERENTE"}`);
  }
  if (diferente) process.exitCode = 1;
}

copiar()
  .catch((erro) => {
    console.error("Não foi possível copiar:", erro.message, erro.detail ?? "");
    process.exitCode = 1;
  })
  .finally(() => {
    sqlite.close();
    return pool.end();
  });
