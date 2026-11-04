const { DatabaseError } = require("pg");

class ErroApp extends Error {
  constructor(status, mensagem, extra = {}) {
    super(mensagem);
    this.status = status;
    this.extra = extra;
  }
}

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: "Rota não encontrada", detalhes: [] });
}

function tratarErros(err, req, res, next) {
  if (err instanceof ErroApp) {
    return res.status(err.status).json({ erro: err.message, detalhes: [], ...err.extra });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido no corpo da requisição", detalhes: [] });
  }

  // erro do banco: só o código e a mensagem. O detail traz dado da pessoa (o e-mail repetido, por exemplo)
  if (err instanceof DatabaseError) console.error(`Erro do banco ${err.code}: ${err.message}`);
  else console.error(err);
  res.status(500).json({ erro: "Erro interno no servidor", detalhes: [] });
}

module.exports = { ErroApp, rotaNaoEncontrada, tratarErros };
