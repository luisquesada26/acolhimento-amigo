const db = require("../database/conexao");

const SELECT_HORARIO = `
  SELECT h.*, a.id AS agendamento_id, a.status AS agendamento_status,
         u.nome AS agendamento_usuario, s.titulo AS agendamento_servico,
         a.descricao AS agendamento_descricao
  FROM horarios h
  LEFT JOIN agendamentos a ON a.horario_id = h.id AND a.status <> 'cancelado'
  LEFT JOIN usuarios u ON u.id = a.usuario_id
  LEFT JOIN servicos s ON s.id = a.servico_id
`;

function listar({ voluntario_id, status, de, ate }) {
  const filtros = [];
  const params = {};

  if (voluntario_id) {
    filtros.push("h.voluntario_id = @voluntario_id");
    params.voluntario_id = voluntario_id;
  }
  if (status) {
    filtros.push("h.status = @status");
    params.status = status;
  }
  if (de) {
    filtros.push("h.data >= @de");
    params.de = de;
  }
  if (ate) {
    filtros.push("h.data <= @ate");
    params.ate = ate;
  }

  const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";
  return db.prepare(`${SELECT_HORARIO} ${where} ORDER BY h.data, h.hora_inicio`).all(params);
}

function buscarPorId(id) {
  return db.prepare(`${SELECT_HORARIO} WHERE h.id = ?`).get(id);
}

// dois horarios se sobrepoem quando um comeca antes do outro terminar
function existeConflito({ voluntario_id, data, hora_inicio, hora_fim }, ignorarId = 0) {
  return Boolean(
    db
      .prepare(`
        SELECT 1 FROM horarios
        WHERE voluntario_id = ? AND data = ? AND hora_inicio < ? AND hora_fim > ? AND id <> ?
      `)
      .get(voluntario_id, data, hora_fim, hora_inicio, ignorarId)
  );
}

function criar(h) {
  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO horarios (voluntario_id, data, hora_inicio, hora_fim)
      VALUES (@voluntario_id, @data, @hora_inicio, @hora_fim)
    `)
    .run(h);
  return buscarPorId(lastInsertRowid);
}

function atualizar(id, { data, hora_inicio, hora_fim }) {
  db.prepare("UPDATE horarios SET data = ?, hora_inicio = ?, hora_fim = ? WHERE id = ?").run(data, hora_inicio, hora_fim, id);
  return buscarPorId(id);
}

function mudarStatus(id, status) {
  db.prepare("UPDATE horarios SET status = ? WHERE id = ?").run(status, id);
}

function excluir(id) {
  db.prepare("DELETE FROM horarios WHERE id = ?").run(id);
}

module.exports = { listar, buscarPorId, existeConflito, criar, atualizar, mudarStatus, excluir };
