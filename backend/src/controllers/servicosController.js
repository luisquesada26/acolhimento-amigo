const service = require("../services/servicosService");
const { lerId } = require("../utils/id");

async function listar(req, res) {
  const { voluntario_id } = req.query;
  res.json(await service.listar({ voluntario_id: voluntario_id ? lerId(voluntario_id) : undefined }));
}

async function meus(req, res) {
  res.json(await service.meus(req.usuario));
}

async function buscar(req, res) {
  res.json(await service.buscar(lerId(req.params.id)));
}

async function criar(req, res) {
  res.status(201).json(await service.criar(req.usuario, req.body));
}

async function atualizar(req, res) {
  res.json(await service.atualizar(req.usuario, lerId(req.params.id), req.body));
}

async function excluir(req, res) {
  const resultado = await service.excluir(req.usuario, lerId(req.params.id));

  if (resultado.desativado) {
    return res.json({
      mensagem: "O serviço tem agendamentos, por isso foi desativado em vez de excluído",
      servico: resultado.servico,
    });
  }
  res.status(204).end();
}

module.exports = { listar, meus, buscar, criar, atualizar, excluir };
