const service = require("../services/horariosService");
const { lerId } = require("../utils/id");
const { data } = require("../schemas/horariosSchema");
const { ErroApp } = require("../middlewares/erros");

function lerData(valor) {
  if (!valor) return undefined;
  if (!data.safeParse(valor).success) throw new ErroApp(400, "Data deve estar no formato AAAA-MM-DD");
  return valor;
}

function meus(req, res) {
  const { status, de, ate } = req.query;

  if (status && !["livre", "reservado"].includes(status)) {
    throw new ErroApp(400, "Status deve ser livre ou reservado");
  }

  res.json(service.meus(req.usuario, { status, de: lerData(de), ate: lerData(ate) }));
}

function criar(req, res) {
  res.status(201).json(service.criar(req.usuario, req.body));
}

function atualizar(req, res) {
  res.json(service.atualizar(req.usuario, lerId(req.params.id), req.body));
}

function excluir(req, res) {
  service.excluir(req.usuario, lerId(req.params.id), req.query.confirmar === "true");
  res.status(204).end();
}

module.exports = { meus, criar, atualizar, excluir };
