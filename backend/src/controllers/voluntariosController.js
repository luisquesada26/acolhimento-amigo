const service = require("../services/voluntariosService");
const { lerId } = require("../utils/id");
const { lerData } = require("../utils/datas");
const { ErroApp } = require("../middlewares/erros");

function listar(req, res) {
  const { q, area, idioma, disponivel, data, turno } = req.query;

  if (turno && !["manha", "tarde", "noite"].includes(turno)) {
    throw new ErroApp(400, "Turno deve ser manha, tarde ou noite");
  }

  res.json(
    service.listar({
      q: q?.trim(),
      area: area ? lerId(area) : undefined,
      idioma: idioma?.trim(),
      disponivel,
      data: lerData(data),
      turno,
    })
  );
}

function buscar(req, res) {
  res.json(service.buscar(lerId(req.params.id)));
}

module.exports = { listar, buscar };
