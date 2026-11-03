const repo = require("../repositories/areasRepository");
const { ErroApp } = require("../middlewares/erros");

async function listar() {
  return repo.listar();
}

async function buscar(id) {
  const area = await repo.buscarPorId(id);
  if (!area) throw new ErroApp(404, "Área não encontrada");
  return area;
}

async function criar(dados) {
  if (await repo.buscarPorNome(dados.nome)) {
    throw new ErroApp(409, "Já existe uma área com esse nome");
  }
  return repo.criar(dados);
}

async function atualizar(id, dados) {
  await buscar(id);
  const outra = await repo.buscarPorNome(dados.nome);
  if (outra && outra.id !== id) {
    throw new ErroApp(409, "Já existe uma área com esse nome");
  }
  return repo.atualizar(id, dados);
}

async function excluir(id) {
  await buscar(id);
  if ((await repo.contarVoluntarios(id)) > 0) {
    throw new ErroApp(409, "Não é possível excluir uma área que tem voluntários");
  }
  await repo.excluir(id);
}

module.exports = { listar, buscar, criar, atualizar, excluir };
