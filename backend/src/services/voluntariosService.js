const repo = require("../repositories/voluntariosRepository");
const { ErroApp } = require("../middlewares/erros");

// cadastro, edicao e exclusao do voluntario ficam em /auth/cadastro e /me

function formatar(v) {
  return { ...v, idiomas: v.idiomas ? v.idiomas.split(",") : [], ativo: Boolean(v.ativo) };
}

// as consultas de cada voluntario saem juntas, e nao uma depois da outra: cada ida ao Supabase demora
async function listar(filtros) {
  const voluntarios = await repo.listar(filtros);
  return Promise.all(
    voluntarios.map(async (v) => ({
      ...formatar(v),
      servicos: (await repo.servicosAtivos(v.id)).map(({ id, titulo }) => ({ id, titulo })),
      proximo_horario: await repo.proximoHorario(v.id, filtros),
    }))
  );
}

async function buscar(id) {
  const v = await repo.buscarPorId(id);
  if (!v) throw new ErroApp(404, "Voluntário não encontrado");
  return {
    ...formatar(v),
    servicos: await repo.servicosAtivos(id),
    horarios: await repo.horariosLivres(id),
  };
}

module.exports = { listar, buscar };
