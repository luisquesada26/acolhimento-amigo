const db = require("../database/conexao");

function listar({ voluntario_id, somenteAtivos = false } = {}) {
  const filtros = [];
  const params = {};

  if (voluntario_id) {
    filtros.push("voluntario_id = @voluntario_id");
    params.voluntario_id = voluntario_id;
  }
  if (somenteAtivos) filtros.push("ativo = 1");

  const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM servicos ${where} ORDER BY voluntario_id, titulo`).all(params);
}

function buscarPorId(id) {
  return db.prepare("SELECT * FROM servicos WHERE id = ?").get(id);
}

function criar(s) {
  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO servicos (voluntario_id, titulo, descricao, duracao_min)
      VALUES (@voluntario_id, @titulo, @descricao, @duracao_min)
    `)
    .run(s);
  return buscarPorId(lastInsertRowid);
}

function atualizar(id, campos) {
  const nomes = Object.keys(campos);
  if (nomes.length > 0) {
    const sets = nomes.map((c) => `${c} = @${c}`).join(", ");
    db.prepare(`UPDATE servicos SET ${sets} WHERE id = @id`).run({ ...campos, id });
  }
  return buscarPorId(id);
}

function excluir(id) {
  db.prepare("DELETE FROM servicos WHERE id = ?").run(id);
}

function contarAgendamentos(id) {
  return db.prepare("SELECT COUNT(*) AS total FROM agendamentos WHERE servico_id = ?").get(id).total;
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir, contarAgendamentos };
