const service = require("../services/voluntariosService");
const { lerId } = require("../utils/id");

function listar(req, res) {
  const { q, area, idioma, disponivel } = req.query;
  res.json(
    service.listar({
      q: q?.trim(),
      area: area ? lerId(area) : undefined,
      idioma: idioma?.trim(),
      disponivel,
    })
  );
}

function buscar(req, res) {
  res.json(service.buscar(lerId(req.params.id)));
}

async function criar(req, res) {
  res.status(201).json(await service.criar(req.body));
}

function atualizar(req, res) {
  res.json(service.atualizar(lerId(req.params.id), req.body));
}

function excluir(req, res) {
  service.excluir(lerId(req.params.id));
  res.status(204).end();
}

module.exports = { listar, buscar, criar, atualizar, excluir };
