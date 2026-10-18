const repo = require("../repositories/voluntariosRepository");
const areasRepo = require("../repositories/areasRepository");
const usuariosService = require("./usuariosService");
const { ErroApp } = require("../middlewares/erros");

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

function buscarSimples(id) {
  const v = repo.buscarPorId(id);
  if (!v) throw new ErroApp(404, "Voluntário não encontrado");
  return v;
}

function buscar(id) {
  const v = buscarSimples(id);
  return {
    ...formatar(v),
    servicos: repo.servicosAtivos(id),
    horarios: repo.horariosLivres(id),
  };
}

async function criar(dados) {
  const usuario = await usuariosService.criar({ ...dados, perfil: "voluntario" });
  return buscar(usuario.voluntario.id);
}

function atualizar(id, dados) {
  buscarSimples(id);

  if (dados.area_id && !areasRepo.buscarPorId(dados.area_id)) {
    throw new ErroApp(400, "Área não encontrada");
  }

  const campos = { ...dados };
  if (campos.idiomas) campos.idiomas = campos.idiomas.join(",");
  if (campos.ativo !== undefined) campos.ativo = campos.ativo ? 1 : 0;

  repo.atualizar(id, campos);
  return buscar(id);
}

// o voluntario e uma extensao do usuario, entao excluir apaga a conta inteira
function excluir(id) {
  const v = buscarSimples(id);
  usuariosService.excluir(v.usuario_id);
}

module.exports = { listar, buscar, criar, atualizar, excluir };
