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

module.exports = { listar, buscar };
