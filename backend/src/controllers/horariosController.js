const service = require("../services/horariosService");
const { lerId } = require("../utils/id");
const { data } = require("../schemas/horariosSchema");
const { ErroApp } = require("../middlewares/erros");

function lerData(valor) {
  if (!valor) return undefined;
  if (!data.safeParse(valor).success) throw new ErroApp(400, "Data deve estar no formato AAAA-MM-DD");
  return valor;
}

function listar(req, res) {
  const { voluntario_id, status, de, ate } = req.query;

  if (status && !["livre", "reservado"].includes(status)) {
    throw new ErroApp(400, "Status deve ser livre ou reservado");
  }

  res.json(
    service.listar({
      voluntario_id: voluntario_id ? lerId(voluntario_id) : undefined,
      status,
      de: lerData(de),
      ate: lerData(ate),
    })
  );
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
  service.excluir(lerId(req.params.id), req.query.confirmar === "true");
  res.status(204).end();
}

module.exports = { listar, buscar, criar, atualizar, excluir };
