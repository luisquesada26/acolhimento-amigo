const repo = require("../repositories/voluntariosRepository");
const { ErroApp } = require("../middlewares/erros");

// cadastro, edicao e exclusao do voluntario ficam em /auth/cadastro e /me

function formatar(v) {
  return { ...v, idiomas: v.idiomas ? v.idiomas.split(",") : [], ativo: Boolean(v.ativo) };
}

// cada voluntario ja vem com os servicos ({ id, titulo }) e o proximo_horario
async function listar(filtros) {
  return (await repo.listar(filtros)).map(formatar);
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
