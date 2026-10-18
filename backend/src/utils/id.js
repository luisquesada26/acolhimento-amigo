const { ErroApp } = require("../middlewares/erros");

function lerId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErroApp(400, "Id inválido");
  }
  return id;
}

module.exports = { lerId };
