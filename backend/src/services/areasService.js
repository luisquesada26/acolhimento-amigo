const repo = require("../repositories/areasRepository");
const { ErroApp } = require("../middlewares/erros");

function listar() {
  return repo.listar();
}

function buscar(id) {
  const area = repo.buscarPorId(id);
  if (!area) throw new ErroApp(404, "Área não encontrada");
  return area;
}

function criar(dados) {
  if (repo.buscarPorNome(dados.nome)) {
    throw new ErroApp(409, "Já existe uma área com esse nome");
  }
  return repo.criar(dados);
}

function atualizar(id, dados) {
  buscar(id);
  const outra = repo.buscarPorNome(dados.nome);
  if (outra && outra.id !== id) {
    throw new ErroApp(409, "Já existe uma área com esse nome");
  }
  return repo.atualizar(id, dados);
}

function excluir(id) {
  buscar(id);
  if (repo.contarVoluntarios(id) > 0) {
    throw new ErroApp(409, "Não é possível excluir uma área que tem voluntários");
  }
  repo.excluir(id);
}

module.exports = { listar, buscar, criar, atualizar, excluir };
