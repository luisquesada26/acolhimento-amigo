const db = require("../database/conexao");

const SELECT_AGENDAMENTO = `
  SELECT a.id, a.status, a.descricao, a.criado_em,
         h.id AS horario_id, h.data, h.hora_inicio, h.hora_fim,
         v.id AS voluntario_id, uv.nome AS voluntario_nome,
         s.id AS servico_id, s.titulo AS servico_titulo,
         u.id AS usuario_id, u.nome AS usuario_nome
  FROM agendamentos a
  JOIN horarios h ON h.id = a.horario_id
  JOIN voluntarios v ON v.id = h.voluntario_id
  JOIN usuarios uv ON uv.id = v.usuario_id
  JOIN servicos s ON s.id = a.servico_id
  JOIN usuarios u ON u.id = a.usuario_id
`;

function listar({ usuario_id, voluntario_id, status }) {
  const filtros = [];
  const params = {};

  if (usuario_id) {
    filtros.push("a.usuario_id = @usuario_id");
    params.usuario_id = usuario_id;
  }
  if (voluntario_id) {
    filtros.push("v.id = @voluntario_id");
    params.voluntario_id = voluntario_id;
  }
  if (status) {
    filtros.push("a.status = @status");
    params.status = status;
  }

  const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";
  return db.prepare(`${SELECT_AGENDAMENTO} ${where} ORDER BY h.data, h.hora_inicio`).all(params);
}

function buscarPorId(id) {
  return db.prepare(`${SELECT_AGENDAMENTO} WHERE a.id = ?`).get(id);
}

function contarConfirmados(usuarioId) {
  return db.prepare("SELECT COUNT(*) AS total FROM agendamentos WHERE usuario_id = ? AND status = 'confirmado'").get(usuarioId).total;
}

function criar(a) {
  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO agendamentos (horario_id, usuario_id, servico_id, descricao)
      VALUES (@horario_id, @usuario_id, @servico_id, @descricao)
    `)
    .run(a);
  return lastInsertRowid;
}

function atualizar(id, campos) {
  const sets = Object.keys(campos).map((c) => `${c} = @${c}`).join(", ");
  db.prepare(`UPDATE agendamentos SET ${sets} WHERE id = @id`).run({ ...campos, id });
}

// devolve os horarios dos agendamentos confirmados do usuario para a agenda do voluntario
function liberarHorariosDoUsuario(usuarioId) {
  db.prepare(`
    UPDATE horarios SET status = 'livre'
    WHERE id IN (SELECT horario_id FROM agendamentos WHERE usuario_id = ? AND status = 'confirmado')
  `).run(usuarioId);
}

module.exports = { listar, buscarPorId, contarConfirmados, criar, atualizar, liberarHorariosDoUsuario };
