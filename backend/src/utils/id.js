const { ErroApp } = require("../middlewares/erros");

// o INTEGER do Postgres vai até 2147483647, e um id maior daria erro no banco. Nenhum registro tem esse id:
// ele vira -1, a busca não acha nada e a resposta continua a de antes ("não encontrado")
const MAIOR_ID = 2147483647;
const idDoBanco = (id) => (id > MAIOR_ID ? -1 : id);

function lerId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErroApp(400, "Id inválido");
  }
  return idDoBanco(id);
}

module.exports = { lerId, idDoBanco };
