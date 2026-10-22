const db = require("../database/conexao");
const { agora, formatarData, diaMais } = require("../utils/datas");

const HORARIO_FUTURO = "(h.data > @hoje OR (h.data = @hoje AND h.hora_inicio > @hora))";

const SELECT_VOLUNTARIO = `
  SELECT v.id, v.usuario_id, u.nome, u.foto, v.area_id, a.nome AS area,
         v.registro_profissional, v.idiomas, v.bio, v.ativo
  FROM voluntarios v
  JOIN usuarios u ON u.id = v.usuario_id
  JOIN areas a ON a.id = v.area_id
`;

// busca: so aparece quem esta ativo e tem pelo menos um servico ativo
function listar({ q, area, idioma, disponivel }) {
  const filtros = [
    "v.ativo = 1",
    "EXISTS (SELECT 1 FROM servicos s WHERE s.voluntario_id = v.id AND s.ativo = 1)",
  ];
  const params = { ...agora() };

  if (q) {
    filtros.push(`(
      u.nome LIKE @q OR v.bio LIKE @q OR EXISTS (
        SELECT 1 FROM servicos s
        WHERE s.voluntario_id = v.id AND s.ativo = 1 AND (s.titulo LIKE @q OR s.descricao LIKE @q)
      )
    )`);
    params.q = `%${q}%`;
  }

  if (area) {
    filtros.push("v.area_id = @area");
    params.area = area;
  }

  if (idioma) {
    filtros.push("(',' || v.idiomas || ',') LIKE @idioma");
    params.idioma = `%,${idioma},%`;
  }

  if (disponivel === "semana") {
    filtros.push(`EXISTS (
      SELECT 1 FROM horarios h
      WHERE h.voluntario_id = v.id AND h.status = 'livre' AND ${HORARIO_FUTURO} AND h.data <= @limite
    )`);
    params.limite = formatarData(diaMais(7));
  }

  return db.prepare(`${SELECT_VOLUNTARIO} WHERE ${filtros.join(" AND ")} ORDER BY u.nome`).all(params);
}

function buscarPorId(id) {
  return db.prepare(`${SELECT_VOLUNTARIO} WHERE v.id = ?`).get(id);
}

function buscarPorUsuarioId(usuarioId) {
  return db.prepare("SELECT * FROM voluntarios WHERE usuario_id = ?").get(usuarioId);
}

function criar(v) {
  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO voluntarios (usuario_id, area_id, registro_profissional, idiomas, bio)
      VALUES (@usuario_id, @area_id, @registro_profissional, @idiomas, @bio)
    `)
    .run(v);
  return lastInsertRowid;
}

function atualizar(id, campos) {
  const nomes = Object.keys(campos);
  if (nomes.length === 0) return;

  const sets = nomes.map((c) => `${c} = @${c}`).join(", ");
  db.prepare(`UPDATE voluntarios SET ${sets} WHERE id = @id`).run({ ...campos, id });
}

function servicosAtivos(voluntarioId) {
  return db
    .prepare("SELECT id, titulo, descricao, duracao_min FROM servicos WHERE voluntario_id = ? AND ativo = 1 ORDER BY titulo")
    .all(voluntarioId);
}

function horariosLivres(voluntarioId) {
  return db
    .prepare(`
      SELECT h.id, h.data, h.hora_inicio, h.hora_fim FROM horarios h
      WHERE h.voluntario_id = @id AND h.status = 'livre' AND ${HORARIO_FUTURO}
      ORDER BY h.data, h.hora_inicio
    `)
    .all({ id: voluntarioId, ...agora() });
}

function proximoHorario(voluntarioId) {
  return horariosLivres(voluntarioId)[0] ?? null;
}

module.exports = {
  listar,
  buscarPorId,
  buscarPorUsuarioId,
  criar,
  atualizar,
  servicosAtivos,
  horariosLivres,
  proximoHorario,
};
