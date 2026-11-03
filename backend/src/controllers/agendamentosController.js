const service = require("../services/agendamentosService");
const { lerId } = require("../utils/id");
const { ErroApp } = require("../middlewares/erros");

async function meus(req, res) {
  const { status } = req.query;

  if (status && !["confirmado", "cancelado", "realizado"].includes(status)) {
    throw new ErroApp(400, "Status deve ser confirmado, cancelado ou realizado");
  }

  res.json(await service.meus(req.usuario, { status }));
}

async function buscar(req, res) {
  res.json(await service.buscarPara(req.usuario, lerId(req.params.id)));
}

async function criar(req, res) {
  res.status(201).json(await service.criarComSala(req.usuario, req.body));
}

async function atualizar(req, res) {
  res.json(await service.atualizarComSala(req.usuario, lerId(req.params.id), req.body));
}

async function cancelar(req, res) {
  res.json(await service.cancelarComSala(req.usuario, lerId(req.params.id)));
}

async function videochamada(req, res) {
  res.json(await service.garantirSala(req.usuario, lerId(req.params.id)));
}

module.exports = { meus, buscar, criar, atualizar, cancelar, videochamada };
