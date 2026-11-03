const { consulta } = require("../database/conexao");

async function listar() {
  return (await consulta("SELECT * FROM areas ORDER BY nome")).rows;
}

async function buscarPorId(id) {
  return (await consulta("SELECT * FROM areas WHERE id = ?", [id])).rows[0];
}

async function buscarPorNome(nome) {
  return (await consulta("SELECT * FROM areas WHERE nome = ?", [nome])).rows[0];
}

async function criar({ nome }) {
  return (await consulta("INSERT INTO areas (nome) VALUES (?) RETURNING *", [nome])).rows[0];
}

async function atualizar(id, { nome }) {
  await consulta("UPDATE areas SET nome = ? WHERE id = ?", [nome, id]);
  return buscarPorId(id);
}

async function excluir(id) {
  await consulta("DELETE FROM areas WHERE id = ?", [id]);
}

// o COUNT do Postgres vem como texto no pg: o ::int devolve número
async function contarVoluntarios(id) {
  return (await consulta("SELECT COUNT(*)::int AS total FROM voluntarios WHERE area_id = ?", [id])).rows[0].total;
}

module.exports = { listar, buscarPorId, buscarPorNome, criar, atualizar, excluir, contarVoluntarios };
