const repo = require("../repositories/servicosRepository");
const { voluntarioLogado, garantirDono } = require("./permissoes");
const { ErroApp } = require("../middlewares/erros");

const formatar = (s) => ({ ...s, ativo: Boolean(s.ativo) });

// lista publica: so os servicos ativos
function listar(filtros) {
  return repo.listar({ ...filtros, somenteAtivos: true }).map(formatar);
}

// os servicos do voluntario logado, ativos ou nao
function meus(usuario) {
  return repo.listar({ voluntario_id: voluntarioLogado(usuario).id }).map(formatar);
}

function buscar(id) {
  const servico = repo.buscarPorId(id);
  if (!servico) throw new ErroApp(404, "Serviço não encontrado");
  return formatar(servico);
}

function criar(usuario, dados) {
  const voluntario = voluntarioLogado(usuario);
  return formatar(repo.criar({ ...dados, voluntario_id: voluntario.id }));
}

function atualizar(usuario, id, dados) {
  garantirDono(buscar(id).voluntario_id, usuario);

  const campos = { ...dados };
  if (campos.ativo !== undefined) campos.ativo = campos.ativo ? 1 : 0;
  return formatar(repo.atualizar(id, campos));
}

// se ja tem agendamento ligado, so desativa para nao perder o historico
function excluir(usuario, id) {
  garantirDono(buscar(id).voluntario_id, usuario);

  if (repo.contarAgendamentos(id) > 0) {
    const servico = repo.atualizar(id, { ativo: 0 });
    return { desativado: true, servico: formatar(servico) };
  }

  repo.excluir(id);
  return { desativado: false };
}

module.exports = { listar, meus, buscar, criar, atualizar, excluir };
