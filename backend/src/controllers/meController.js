const usuariosService = require("../services/usuariosService");

function ver(req, res) {
  res.json(usuariosService.buscar(req.usuario.id));
}

async function atualizar(req, res) {
  res.json(await usuariosService.atualizar(req.usuario.id, req.body));
}

function excluir(req, res) {
  usuariosService.excluir(req.usuario.id);
  res.status(204).end();
}

module.exports = { ver, atualizar, excluir };
