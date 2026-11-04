const service = require("../services/voluntariosService");
const { lerId } = require("../utils/id");
const { lerData } = require("../utils/datas");
const { ErroApp } = require("../middlewares/erros");

async function listar(req, res) {
  const { q, area, idioma, disponivel, data, turno } = req.query;
  // o Postgres recusa texto com o caractere nulo (\0); sem ele, a busca responde como respondia no SQLite
  const semNulo = (texto) => texto?.replaceAll("\0", "");

  if (turno && !["manha", "tarde", "noite"].includes(turno)) {
    throw new ErroApp(400, "Turno deve ser manha, tarde ou noite");
  }

  res.json(
    await service.listar({
      q: semNulo(q)?.trim(),
      area: area ? lerId(area) : undefined,
      idioma: semNulo(idioma)?.trim(),
      disponivel,
      data: lerData(data),
      turno,
    })
  );
}

async function buscar(req, res) {
  res.json(await service.buscar(lerId(req.params.id)));
}

module.exports = { listar, buscar };
