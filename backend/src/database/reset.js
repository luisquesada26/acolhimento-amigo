const { pool, transacao } = require("./conexao");
const { TABELAS, recriarTabelas, contar } = require("./recriarTabelas");
const seed = require("./seed");
const { DATABASE_URL } = require("../config/env");

if (!DATABASE_URL) {
  console.error("Falta a DATABASE_URL no backend/.env (o endereço do Postgres, veja o README)");
  process.exit(1);
}

// tudo numa transação: se algo falhar no meio, o banco continua como estava
async function resetar() {
  await transacao(async () => {
    await recriarTabelas();
    await seed();
  });

  // o endereço sem o usuário e a senha
  const { host, pathname } = new URL(DATABASE_URL);
  console.log(`Banco recriado em ${host}${pathname}`);
  for (const tabela of TABELAS) {
    console.log(`  ${tabela}: ${await contar(tabela)}`);
  }
}

resetar()
  .catch((erro) => {
    console.error("Não foi possível recriar o banco:", erro.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
