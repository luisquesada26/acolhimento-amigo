const db = require("../database/conexao");

function listar() {
  return db.prepare("SELECT * FROM areas ORDER BY nome").all();
}

function buscarPorId(id) {
  return db.prepare("SELECT * FROM areas WHERE id = ?").get(id);
}

function buscarPorNome(nome) {
  return db.prepare("SELECT * FROM areas WHERE nome = ?").get(nome);
}

function criar({ nome }) {
  const { lastInsertRowid } = db.prepare("INSERT INTO areas (nome) VALUES (?)").run(nome);
  return buscarPorId(lastInsertRowid);
}

function atualizar(id, { nome }) {
  db.prepare("UPDATE areas SET nome = ? WHERE id = ?").run(nome, id);
  return buscarPorId(id);
}

function excluir(id) {
  db.prepare("DELETE FROM areas WHERE id = ?").run(id);
}

function contarVoluntarios(id) {
  return db.prepare("SELECT COUNT(*) AS total FROM voluntarios WHERE area_id = ?").get(id).total;
}

module.exports = { listar, buscarPorId, buscarPorNome, criar, atualizar, excluir, contarVoluntarios };
