const repo = require("../repositories/voluntariosRepository");
const { ErroApp } = require("../middlewares/erros");

// cadastro, edicao e exclusao do voluntario ficam em /auth/cadastro e /me

function formatar(v) {
  return { ...v, idiomas: v.idiomas.split(","), ativo: Boolean(v.ativo) };
}

function listar(filtros) {
  return repo.listar(filtros).map((v) => ({
    ...formatar(v),
    servicos: repo.servicosAtivos(v.id).map(({ id, titulo }) => ({ id, titulo })),
    proximo_horario: repo.proximoHorario(v.id),
  }));
}

function buscar(id) {
  const v = repo.buscarPorId(id);
  if (!v) throw new ErroApp(404, "Voluntário não encontrado");
  return {
    ...formatar(v),
    servicos: repo.servicosAtivos(id),
    horarios: repo.horariosLivres(id),
  };
}

module.exports = { listar, buscar };
