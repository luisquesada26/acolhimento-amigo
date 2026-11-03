const { consulta } = require("../database/conexao");

async function listar({ voluntario_id, somenteAtivos = false } = {}) {
  const filtros = [];
  const params = {};

  if (voluntario_id) {
    filtros.push("voluntario_id = @voluntario_id");
    params.voluntario_id = voluntario_id;
  }
  if (somenteAtivos) filtros.push("ativo = 1");

  const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";
  return (await consulta(`SELECT * FROM servicos ${where} ORDER BY voluntario_id, titulo`, params)).rows;
}

async function buscarPorId(id) {
  return (await consulta("SELECT * FROM servicos WHERE id = ?", [id])).rows[0];
}

async function criar(s) {
  const { rows } = await consulta(`
    INSERT INTO servicos (voluntario_id, titulo, descricao, duracao_min)
    VALUES (@voluntario_id, @titulo, @descricao, @duracao_min)
    RETURNING *
  `, s);
  return rows[0];
}

async function atualizar(id, campos) {
  const nomes = Object.keys(campos);
  if (nomes.length > 0) {
    const sets = nomes.map((c) => `${c} = @${c}`).join(", ");
    await consulta(`UPDATE servicos SET ${sets} WHERE id = @id`, { ...campos, id });
  }
  return buscarPorId(id);
}

async function excluir(id) {
  await consulta("DELETE FROM servicos WHERE id = ?", [id]);
}

async function contarAgendamentos(id) {
  return (await consulta("SELECT COUNT(*)::int AS total FROM agendamentos WHERE servico_id = ?", [id])).rows[0].total;
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir, contarAgendamentos };
