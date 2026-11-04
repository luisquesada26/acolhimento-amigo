const { consulta } = require("../database/conexao");
const { agora, formatarData, diaMais } = require("../utils/datas");

const HORARIO_FUTURO = "(h.data > @hoje OR (h.data = @hoje AND h.hora_inicio > @hora))";

// inicio e fim (fora) de cada turno, comparando o texto HH:MM
const TURNOS = {
  manha: ["06:00", "12:00"],
  tarde: ["12:00", "18:00"],
  noite: ["18:00", "24:00"],
};

// no LIKE do Postgres a \ escapa a letra seguinte, e no do SQLite nao: dobrada, ela vale como letra, como antes
const semEscape = (texto) => texto.replace(/\\/g, "\\\\");

// condicoes de um horario livre e futuro que atende a todos os filtros de horario ao mesmo tempo
function horarioQueAtende({ disponivel, data, turno }, params) {
  const condicoes = ["h.status = 'livre'", HORARIO_FUTURO];

  if (disponivel === "semana") {
    condicoes.push("h.data <= @limite");
    params.limite = formatarData(diaMais(7));
  }

  if (data) {
    condicoes.push("h.data = @data");
    params.data = data;
  }

  if (turno) {
    condicoes.push("h.hora_inicio >= @turnoInicio AND h.hora_inicio < @turnoFim");
    [params.turnoInicio, params.turnoFim] = TURNOS[turno];
  }

  return condicoes.join(" AND ");
}

const SELECT_VOLUNTARIO = `
  SELECT v.id, v.usuario_id, u.nome, u.foto, v.area_id, a.nome AS area,
         v.registro_profissional, v.idiomas, v.bio, v.ativo
  FROM voluntarios v
  JOIN usuarios u ON u.id = v.usuario_id
  JOIN areas a ON a.id = v.area_id
`;

// busca: so aparece quem esta ativo e tem pelo menos um servico ativo.
// ILIKE porque o LIKE do SQLite ignorava maiusculas e o do Postgres nao
async function listar({ q, area, idioma, disponivel, data, turno }) {
  const filtros = [
    "v.ativo = 1",
    "EXISTS (SELECT 1 FROM servicos s WHERE s.voluntario_id = v.id AND s.ativo = 1)",
  ];
  const params = { ...agora() };

  if (q) {
    filtros.push(`(
      u.nome ILIKE @q OR v.bio ILIKE @q OR EXISTS (
        SELECT 1 FROM servicos s
        WHERE s.voluntario_id = v.id AND s.ativo = 1 AND (s.titulo ILIKE @q OR s.descricao ILIKE @q)
      )
    )`);
    params.q = `%${semEscape(q)}%`;
  }

  if (area) {
    filtros.push("v.area_id = @area");
    params.area = area;
  }

  if (idioma) {
    filtros.push("(',' || v.idiomas || ',') ILIKE @idioma");
    params.idioma = `%,${semEscape(idioma)},%`;
  }

  if (disponivel === "semana" || data || turno) {
    filtros.push(`EXISTS (
      SELECT 1 FROM horarios h
      WHERE h.voluntario_id = v.id AND ${horarioQueAtende({ disponivel, data, turno }, params)}
    )`);
  }

  // os servicos e o proximo horario de cada um vem na mesma consulta, e nao numa ida ao banco por voluntario.
  // O proximo horario usa os mesmos filtros de horario da busca, para o cartao mostrar o que a pessoa procurou
  const { rows } = await consulta(`
    SELECT v.id, v.usuario_id, u.nome, u.foto, v.area_id, a.nome AS area,
           v.registro_profissional, v.idiomas, v.bio, v.ativo,
           COALESCE((
             SELECT json_agg(json_build_object('id', s.id, 'titulo', s.titulo) ORDER BY s.titulo)
             FROM servicos s WHERE s.voluntario_id = v.id AND s.ativo = 1
           ), '[]') AS servicos,
           (
             SELECT json_build_object('id', h.id, 'data', h.data, 'hora_inicio', h.hora_inicio, 'hora_fim', h.hora_fim)
             FROM horarios h
             WHERE h.voluntario_id = v.id AND ${horarioQueAtende({ disponivel, data, turno }, params)}
             ORDER BY h.data, h.hora_inicio
             LIMIT 1
           ) AS proximo_horario
    FROM voluntarios v
    JOIN usuarios u ON u.id = v.usuario_id
    JOIN areas a ON a.id = v.area_id
    WHERE ${filtros.join(" AND ")}
    ORDER BY u.nome
  `, params);
  return rows;
}

async function buscarPorId(id) {
  return (await consulta(`${SELECT_VOLUNTARIO} WHERE v.id = ?`, [id])).rows[0];
}

async function buscarPorUsuarioId(usuarioId) {
  return (await consulta("SELECT * FROM voluntarios WHERE usuario_id = ?", [usuarioId])).rows[0];
}

async function criar(v) {
  const { rows } = await consulta(`
    INSERT INTO voluntarios (usuario_id, area_id, registro_profissional, idiomas, bio)
    VALUES (@usuario_id, @area_id, @registro_profissional, @idiomas, @bio)
    RETURNING id
  `, v);
  return rows[0].id;
}

async function atualizar(id, campos) {
  const nomes = Object.keys(campos);
  if (nomes.length === 0) return;

  const sets = nomes.map((c) => `${c} = @${c}`).join(", ");
  await consulta(`UPDATE voluntarios SET ${sets} WHERE id = @id`, { ...campos, id });
}

async function servicosAtivos(voluntarioId) {
  const { rows } = await consulta(
    "SELECT id, titulo, descricao, duracao_min FROM servicos WHERE voluntario_id = ? AND ativo = 1 ORDER BY titulo",
    [voluntarioId]
  );
  return rows;
}

async function horariosLivres(voluntarioId) {
  const { rows } = await consulta(`
    SELECT h.id, h.data, h.hora_inicio, h.hora_fim FROM horarios h
    WHERE h.voluntario_id = @id AND h.status = 'livre' AND ${HORARIO_FUTURO}
    ORDER BY h.data, h.hora_inicio
  `, { id: voluntarioId, ...agora() });
  return rows;
}

module.exports = {
  listar,
  buscarPorId,
  buscarPorUsuarioId,
  criar,
  atualizar,
  servicosAtivos,
  horariosLivres,
};
