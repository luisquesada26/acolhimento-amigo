const service = require("../services/horariosService");
const { lerId } = require("../utils/id");
const { lerData } = require("../utils/datas");
const { ErroApp } = require("../middlewares/erros");

async function meus(req, res) {
  const { status, de, ate } = req.query;

  if (status && !["livre", "reservado"].includes(status)) {
    throw new ErroApp(400, "Status deve ser livre ou reservado");
  }

  res.json(await service.meus(req.usuario, { status, de: lerData(de), ate: lerData(ate) }));
}

async function criar(req, res) {
  res.status(201).json(await service.criar(req.usuario, req.body));
}

async function atualizar(req, res) {
  res.json(await service.atualizar(req.usuario, lerId(req.params.id), req.body));
}

async function excluir(req, res) {
  await service.excluirComSala(req.usuario, lerId(req.params.id), req.query.confirmar === "true");
  res.status(204).end();
}

module.exports = { meus, criar, atualizar, excluir };
