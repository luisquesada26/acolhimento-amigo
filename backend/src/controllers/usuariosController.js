const service = require("../services/usuariosService");
const { lerId } = require("../utils/id");

function listar(req, res) {
  res.json(service.listar({ perfil: req.query.perfil }));
}

function buscar(req, res) {
  res.json(service.buscar(lerId(req.params.id)));
}

async function criar(req, res) {
  res.status(201).json(await service.criar(req.body));
}

async function atualizar(req, res) {
  res.json(await service.atualizar(lerId(req.params.id), req.body));
}

function excluir(req, res) {
  service.excluir(lerId(req.params.id));
  res.status(204).end();
}

module.exports = { listar, buscar, criar, atualizar, excluir };
