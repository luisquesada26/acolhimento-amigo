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

// dois pedidos com o mesmo nome ao mesmo tempo (duplo clique) passam juntos pela conferência,
// e o banco barra o segundo: a resposta é a mesma da conferência
async function semNomeRepetido(gravar) {
  try {
    return await gravar();
  } catch (erro) {
    if (erro.code === "23505" && erro.constraint === "areas_nome_key") {
      throw new ErroApp(409, "Já existe uma área com esse nome");
    }
    throw erro;
  }
}

async function criar(dados) {
  if (await repo.buscarPorNome(dados.nome)) {
    throw new ErroApp(409, "Já existe uma área com esse nome");
  }
  return semNomeRepetido(() => repo.criar(dados));
}

async function atualizar(id, dados) {
  await buscar(id);
  const outra = await repo.buscarPorNome(dados.nome);
  if (outra && outra.id !== id) {
    throw new ErroApp(409, "Já existe uma área com esse nome");
  }
  return semNomeRepetido(() => repo.atualizar(id, dados));
}

async function excluir(id) {
  await buscar(id);
  if ((await repo.contarVoluntarios(id)) > 0) {
    throw new ErroApp(409, "Não é possível excluir uma área que tem voluntários");
  }
  await repo.excluir(id);
}

module.exports = { listar, buscar, criar, atualizar, excluir };
