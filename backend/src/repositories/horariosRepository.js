const { consulta } = require("../database/conexao");

const SELECT_HORARIO = `
  SELECT h.*, a.id AS agendamento_id, a.status AS agendamento_status,
         u.nome AS agendamento_usuario, s.titulo AS agendamento_servico,
         s.traducoes - 'descricao' AS agendamento_servico_traducoes,
         a.descricao AS agendamento_descricao
  FROM horarios h
  LEFT JOIN agendamentos a ON a.horario_id = h.id AND a.status <> 'cancelado'
  LEFT JOIN usuarios u ON u.id = a.usuario_id
  LEFT JOIN servicos s ON s.id = a.servico_id
`;

async function listar({ voluntario_id, status, de, ate }) {
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
  return (await consulta(`${SELECT_HORARIO} ${where} ORDER BY h.data, h.hora_inicio`, params)).rows;
}

// travar: ninguém muda nem apaga o horário até a transação acabar (quem tentar, espera)
async function buscarPorId(id, { travar = false } = {}) {
  return (await consulta(`${SELECT_HORARIO} WHERE h.id = ? ${travar ? "FOR UPDATE OF h" : ""}`, [id])).rows[0];
}

// dois horarios se sobrepoem quando um comeca antes do outro terminar
async function existeConflito({ voluntario_id, data, hora_inicio, hora_fim }, ignorarId = 0) {
  const { rows } = await consulta(`
    SELECT 1 FROM horarios
    WHERE voluntario_id = ? AND data = ? AND hora_inicio < ? AND hora_fim > ? AND id <> ?
  `, [voluntario_id, data, hora_fim, hora_inicio, ignorarId]);
  return rows.length > 0;
}

async function criar(h) {
  const { rows } = await consulta(`
    INSERT INTO horarios (voluntario_id, data, hora_inicio, hora_fim)
    VALUES (@voluntario_id, @data, @hora_inicio, @hora_fim)
    RETURNING id
  `, h);
  return buscarPorId(rows[0].id);
}

// só muda horário livre: se alguém acabou de reservar, não muda nada e devolve null
async function atualizar(id, { data, hora_inicio, hora_fim }) {
  const { rowCount } = await consulta(
    "UPDATE horarios SET data = ?, hora_inicio = ?, hora_fim = ? WHERE id = ? AND status = 'livre'",
    [data, hora_inicio, hora_fim, id]
  );
  return rowCount ? buscarPorId(id) : null;
}

async function mudarStatus(id, status) {
  await consulta("UPDATE horarios SET status = ? WHERE id = ?", [status, id]);
}

// reserva só se ainda estiver livre. Dois pedidos ao mesmo tempo podem ter lido "livre":
// o segundo espera o primeiro terminar e não reserva nada (devolve false)
async function reservar(id) {
  const { rowCount } = await consulta("UPDATE horarios SET status = 'reservado' WHERE id = ? AND status = 'livre'", [id]);
  return rowCount > 0;
}

async function excluir(id) {
  await consulta("DELETE FROM horarios WHERE id = ?", [id]);
}

module.exports = { listar, buscarPorId, existeConflito, criar, atualizar, mudarStatus, reservar, excluir };
