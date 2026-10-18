const service = require("../services/areasService");
const { lerId } = require("../utils/id");

function listar(req, res) {
  res.json(service.listar());
}

function buscar(req, res) {
  res.json(service.buscar(lerId(req.params.id)));
}

function criar(req, res) {
  res.status(201).json(service.criar(req.body));
}

function atualizar(req, res) {
  res.json(service.atualizar(lerId(req.params.id), req.body));
}

function excluir(req, res) {
  service.excluir(lerId(req.params.id));
  res.status(204).end();
}

module.exports = { listar, buscar, criar, atualizar, excluir };
