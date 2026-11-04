const { consulta } = require("../database/conexao");

// senha_hash fica de fora de proposito
const COLUNAS =
  "id, nome, email, telefone, perfil, pais_origem, idiomas, foto, cep, rua, numero, complemento, bairro, cidade, estado, aceite_lgpd, criado_em";

async function buscarPorId(id) {
  return (await consulta(`SELECT ${COLUNAS} FROM usuarios WHERE id = ?`, [id])).rows[0];
}

async function buscarPorEmail(email) {
  return (await consulta(`SELECT ${COLUNAS} FROM usuarios WHERE email = ?`, [email])).rows[0];
}

// unico lugar que le a senha_hash, so para conferir no login
async function buscarSenhaPorEmail(email) {
  return (await consulta("SELECT id, senha_hash FROM usuarios WHERE email = ?", [email])).rows[0];
}

async function criar(u) {
  const { rows } = await consulta(`
    INSERT INTO usuarios (nome, email, senha_hash, telefone, perfil, pais_origem, idiomas, aceite_lgpd)
    VALUES (@nome, @email, @senha_hash, @telefone, @perfil, @pais_origem, @idiomas, @aceite_lgpd)
    RETURNING id
  `, u);
  return rows[0].id;
}

async function atualizar(id, campos) {
  const nomes = Object.keys(campos);
  if (nomes.length === 0) return;

  const sets = nomes.map((c) => `${c} = @${c}`).join(", ");
  await consulta(`UPDATE usuarios SET ${sets} WHERE id = @id`, { ...campos, id });
}

async function excluir(id) {
  await consulta("DELETE FROM usuarios WHERE id = ?", [id]);
}

module.exports = { buscarPorId, buscarPorEmail, buscarSenhaPorEmail, criar, atualizar, excluir };
