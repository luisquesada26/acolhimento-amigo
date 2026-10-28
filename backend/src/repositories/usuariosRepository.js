const db = require("../database/conexao");

// senha_hash fica de fora de proposito
const COLUNAS =
  "id, nome, email, telefone, perfil, pais_origem, idiomas, foto, cep, rua, numero, complemento, bairro, cidade, estado, aceite_lgpd, criado_em";

function buscarPorId(id) {
  return db.prepare(`SELECT ${COLUNAS} FROM usuarios WHERE id = ?`).get(id);
}

function buscarPorEmail(email) {
  return db.prepare(`SELECT ${COLUNAS} FROM usuarios WHERE email = ?`).get(email);
}

// unico lugar que le a senha_hash, so para conferir no login
function buscarSenhaPorEmail(email) {
  return db.prepare("SELECT id, senha_hash FROM usuarios WHERE email = ?").get(email);
}

function criar(u) {
  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, telefone, perfil, pais_origem, idiomas, aceite_lgpd)
      VALUES (@nome, @email, @senha_hash, @telefone, @perfil, @pais_origem, @idiomas, @aceite_lgpd)
    `)
    .run(u);
  return lastInsertRowid;
}

function atualizar(id, campos) {
  const nomes = Object.keys(campos);
  if (nomes.length === 0) return;

  const sets = nomes.map((c) => `${c} = @${c}`).join(", ");
  db.prepare(`UPDATE usuarios SET ${sets} WHERE id = @id`).run({ ...campos, id });
}

function excluir(id) {
  db.prepare("DELETE FROM usuarios WHERE id = ?").run(id);
}

module.exports = { buscarPorId, buscarPorEmail, buscarSenhaPorEmail, criar, atualizar, excluir };
