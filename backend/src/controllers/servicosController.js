const service = require("../services/servicosService");
const { lerId } = require("../utils/id");

function listar(req, res) {
  const { voluntario_id } = req.query;
  res.json(service.listar({ voluntario_id: voluntario_id ? lerId(voluntario_id) : undefined }));
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
  const resultado = service.excluir(lerId(req.params.id));

  if (resultado.desativado) {
    return res.json({
      mensagem: "O serviço tem agendamentos, por isso foi desativado em vez de excluído",
      servico: resultado.servico,
    });
  }
  res.status(204).end();
}

module.exports = { listar, buscar, criar, atualizar, excluir };
