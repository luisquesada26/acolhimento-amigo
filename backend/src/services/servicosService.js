const repo = require("../repositories/servicosRepository");
const voluntariosRepo = require("../repositories/voluntariosRepository");
const { ErroApp } = require("../middlewares/erros");

const formatar = (s) => ({ ...s, ativo: Boolean(s.ativo) });

function listar(filtros) {
  return repo.listar(filtros).map(formatar);
}

function buscar(id) {
  const servico = repo.buscarPorId(id);
  if (!servico) throw new ErroApp(404, "Serviço não encontrado");
  return formatar(servico);
}

function criar(dados) {
  if (!voluntariosRepo.buscarPorId(dados.voluntario_id)) {
    throw new ErroApp(400, "Voluntário não encontrado");
  }
  return formatar(repo.criar(dados));
}

function atualizar(id, dados) {
  buscar(id);
  const campos = { ...dados };
  if (campos.ativo !== undefined) campos.ativo = campos.ativo ? 1 : 0;
  return formatar(repo.atualizar(id, campos));
}

// se ja tem agendamento ligado, so desativa para nao perder o historico
function excluir(id) {
  buscar(id);

  if (repo.contarAgendamentos(id) > 0) {
    const servico = repo.atualizar(id, { ativo: 0 });
    return { desativado: true, servico: formatar(servico) };
  }

  repo.excluir(id);
  return { desativado: false };
}

module.exports = { listar, buscar, criar, atualizar, excluir };
