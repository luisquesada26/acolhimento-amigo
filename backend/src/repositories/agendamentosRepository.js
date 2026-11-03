const db = require("../database/conexao");

const SELECT_AGENDAMENTO = `
  SELECT a.id, a.status, a.descricao, a.anotacao, a.criado_em, a.link_video, a.google_evento_id,
         h.id AS horario_id, h.data, h.hora_inicio, h.hora_fim,
         v.id AS voluntario_id, uv.nome AS voluntario_nome, uv.foto AS voluntario_foto, uv.email AS voluntario_email, ar.nome AS voluntario_area,
         s.id AS servico_id, s.titulo AS servico_titulo,
         u.id AS usuario_id, u.nome AS usuario_nome, u.pais_origem AS usuario_pais, u.idiomas AS usuario_idiomas,
         u.email AS usuario_email, u.telefone AS usuario_telefone, u.foto AS usuario_foto
  FROM agendamentos a
  JOIN horarios h ON h.id = a.horario_id
  JOIN voluntarios v ON v.id = h.voluntario_id
  JOIN usuarios uv ON uv.id = v.usuario_id
  JOIN areas ar ON ar.id = v.area_id
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

// outro atendimento confirmado do mesmo usuário que se sobrepõe a este horário
function temConflito(usuarioId, horario, ignorarId = 0) {
  return Boolean(db.prepare(`
    SELECT 1 FROM agendamentos a
    JOIN horarios h ON h.id = a.horario_id
    WHERE a.usuario_id = ? AND a.status = 'confirmado' AND a.id <> ?
      AND h.data = ? AND h.hora_inicio < ? AND h.hora_fim > ?
  `).get(usuarioId, ignorarId, horario.data, horario.hora_fim, horario.hora_inicio));
}

// salas do Meet que somem junto com um horário ou com uma conta (como usuário ou como voluntário)
function salasDoHorario(horarioId) {
  return db.prepare("SELECT google_evento_id FROM agendamentos WHERE horario_id = ? AND google_evento_id IS NOT NULL")
    .all(horarioId).map((a) => a.google_evento_id);
}

function salasDaConta(usuarioId) {
  return db.prepare(`
    SELECT a.google_evento_id FROM agendamentos a
    JOIN horarios h ON h.id = a.horario_id
    JOIN voluntarios v ON v.id = h.voluntario_id
    WHERE a.status = 'confirmado' AND a.google_evento_id IS NOT NULL AND (a.usuario_id = ? OR v.usuario_id = ?)
  `).all(usuarioId, usuarioId).map((a) => a.google_evento_id);
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

module.exports = { listar, buscarPorId, temConflito, salasDoHorario, salasDaConta, criar, atualizar, liberarHorariosDoUsuario };
