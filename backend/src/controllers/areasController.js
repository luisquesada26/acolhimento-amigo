const service = require("../services/areasService");
const { lerId } = require("../utils/id");

async function listar(req, res) {
  res.json(await service.listar());
}

async function buscar(req, res) {
  res.json(await service.buscar(lerId(req.params.id)));
}

async function criar(req, res) {
  res.status(201).json(await service.criar(req.body));
}

async function atualizar(req, res) {
  res.json(await service.atualizar(lerId(req.params.id), req.body));
}

async function excluir(req, res) {
  await service.excluir(lerId(req.params.id));
  res.status(204).end();
}

module.exports = { listar, buscar, criar, atualizar, excluir };
