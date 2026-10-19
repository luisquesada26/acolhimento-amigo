const service = require("../services/agendamentosService");
const { lerId } = require("../utils/id");
const { ErroApp } = require("../middlewares/erros");

function meus(req, res) {
  const { status } = req.query;

  if (status && !["confirmado", "cancelado", "realizado"].includes(status)) {
    throw new ErroApp(400, "Status deve ser confirmado, cancelado ou realizado");
  }

  res.json(service.meus(req.usuario, { status }));
}

function buscar(req, res) {
  res.json(service.buscarPara(req.usuario, lerId(req.params.id)));
}

function criar(req, res) {
  res.status(201).json(service.criar(req.usuario, req.body));
}

function atualizar(req, res) {
  res.json(service.atualizar(req.usuario, lerId(req.params.id), req.body));
}

function cancelar(req, res) {
  res.json(service.cancelar(req.usuario, lerId(req.params.id)));
}

module.exports = { meus, buscar, criar, atualizar, cancelar };
