const service = require("../services/agendamentosService");
const { lerId } = require("../utils/id");
const { ErroApp } = require("../middlewares/erros");

function listar(req, res) {
  const { usuario_id, voluntario_id, status } = req.query;

  if (status && !["confirmado", "cancelado", "realizado"].includes(status)) {
    throw new ErroApp(400, "Status deve ser confirmado, cancelado ou realizado");
  }

  res.json(
    service.listar({
      usuario_id: usuario_id ? lerId(usuario_id) : undefined,
      voluntario_id: voluntario_id ? lerId(voluntario_id) : undefined,
      status,
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

function cancelar(req, res) {
  res.json(service.cancelar(lerId(req.params.id)));
}

module.exports = { listar, buscar, criar, atualizar, cancelar };
