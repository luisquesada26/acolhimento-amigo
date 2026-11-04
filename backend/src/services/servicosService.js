const { transacao } = require("../database/conexao");
const repo = require("../repositories/servicosRepository");
const { voluntarioLogado, garantirDono } = require("./permissoes");
const { ErroApp } = require("../middlewares/erros");

const formatar = (s) => ({ ...s, ativo: Boolean(s.ativo) });

// lista publica: so os servicos ativos
async function listar(filtros) {
  return (await repo.listar({ ...filtros, somenteAtivos: true })).map(formatar);
}

// os servicos do voluntario logado, ativos ou nao
async function meus(usuario) {
  return (await repo.listar({ voluntario_id: (await voluntarioLogado(usuario)).id })).map(formatar);
}

async function buscar(id, opcoes) {
  const servico = await repo.buscarPorId(id, opcoes);
  if (!servico) throw new ErroApp(404, "Serviço não encontrado");
  return formatar(servico);
}

async function criar(usuario, dados) {
  const voluntario = await voluntarioLogado(usuario);
  return formatar(await repo.criar({ ...dados, voluntario_id: voluntario.id }));
}

async function atualizar(usuario, id, dados) {
  await garantirDono((await buscar(id)).voluntario_id, usuario);

  const campos = { ...dados };
  if (campos.ativo !== undefined) campos.ativo = campos.ativo ? 1 : 0;
  return formatar(await repo.atualizar(id, campos));
}

// se ja tem agendamento ligado, so desativa para nao perder o historico.
// O servico fica travado: uma marcacao que chegar no meio espera, e a contagem abaixo nao fica velha
const excluir = (usuario, id) =>
  transacao(async () => {
    await garantirDono((await buscar(id, { trava: "exclusiva" })).voluntario_id, usuario);

    if ((await repo.contarAgendamentos(id)) > 0) {
      const servico = await repo.atualizar(id, { ativo: 0 });
      return { desativado: true, servico: formatar(servico) };
    }

    await repo.excluir(id);
    return { desativado: false };
  });

module.exports = { listar, meus, buscar, criar, atualizar, excluir };
