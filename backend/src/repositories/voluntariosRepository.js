const db = require("../database/conexao");

function buscarPorUsuarioId(usuarioId) {
  return db.prepare("SELECT * FROM voluntarios WHERE usuario_id = ?").get(usuarioId);
}

function criar(v) {
  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO voluntarios (usuario_id, area_id, registro_profissional, idiomas, bio)
      VALUES (@usuario_id, @area_id, @registro_profissional, @idiomas, @bio)
    `)
    .run(v);
  return lastInsertRowid;
}

module.exports = { buscarPorUsuarioId, criar };
