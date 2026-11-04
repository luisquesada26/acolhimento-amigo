const { consulta } = require("../database/conexao");
const { JUNTAR_TRADUCOES, NOVAS_TRADUCOES } = require("../utils/traducoes");

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

// trava, até o fim da transação: "compartilhada" (quem marca: o serviço não muda nem some no meio)
// ou "exclusiva" (quem exclui: uma marcação que chegar no meio espera)
const TRAVAS = { compartilhada: "FOR SHARE", exclusiva: "FOR UPDATE" };

async function buscarPorId(id, { trava } = {}) {
  return (await consulta(`SELECT * FROM servicos WHERE id = ? ${TRAVAS[trava] ?? ""}`, [id])).rows[0];
}

async function criar(s) {
  const { rows } = await consulta(`
    INSERT INTO servicos (voluntario_id, titulo, descricao, duracao_min, traducoes)
    VALUES (@voluntario_id, @titulo, @descricao, @duracao_min, ${NOVAS_TRADUCOES})
    RETURNING *
  `, { ...s, traducoes: JSON.stringify(s.traducoes ?? {}) });
  return rows[0];
}

// traducoes: só as dos campos que mudaram ({ titulo, descricao: tradução ou null }); as outras ficam como estão
async function atualizar(id, campos, traducoes = {}) {
  const sets = Object.keys(campos).map((c) => `${c} = @${c}`);
  if (Object.keys(traducoes).length) sets.push(JUNTAR_TRADUCOES);
  if (sets.length > 0) {
    await consulta(`UPDATE servicos SET ${sets.join(", ")} WHERE id = @id`, { ...campos, traducoes: JSON.stringify(traducoes), id });
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
