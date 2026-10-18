const db = require("../database/conexao");
const repo = require("../repositories/agendamentosRepository");
const horariosRepo = require("../repositories/horariosRepository");
const servicosRepo = require("../repositories/servicosRepository");
const usuariosRepo = require("../repositories/usuariosRepository");
const { ErroApp } = require("../middlewares/erros");
const { agora } = require("../utils/datas");

const LIMITE_CONFIRMADOS = 3;

function formatar(a) {
  return {
    id: a.id,
    status: a.status,
    descricao: a.descricao,
    criado_em: a.criado_em,
    horario: { id: a.horario_id, data: a.data, hora_inicio: a.hora_inicio, hora_fim: a.hora_fim },
    voluntario: { id: a.voluntario_id, nome: a.voluntario_nome },
    servico: { id: a.servico_id, titulo: a.servico_titulo },
    usuario: { id: a.usuario_id, nome: a.usuario_nome },
  };
}

function jaComecou(horario) {
  const { hoje, hora } = agora();
  return horario.data < hoje || (horario.data === hoje && horario.hora_inicio <= hora);
}

function jaTerminou(horario) {
  const { hoje, hora } = agora();
  return horario.data < hoje || (horario.data === hoje && horario.hora_fim <= hora);
}

function horarioDisponivel(horarioId) {
  const horario = horariosRepo.buscarPorId(horarioId);
  if (!horario) throw new ErroApp(404, "Horário não encontrado");
  if (jaComecou(horario)) throw new ErroApp(400, "Este horário já passou. Escolha outro.");
  if (horario.status !== "livre") {
    throw new ErroApp(409, "Este horário acabou de ser reservado. Escolha outro.");
  }
  return horario;
}

function listar(filtros) {
  return repo.listar(filtros).map(formatar);
}

function buscar(id) {
  const agendamento = repo.buscarPorId(id);
  if (!agendamento) throw new ErroApp(404, "Agendamento não encontrado");
  return formatar(agendamento);
}

const criar = db.transaction((dados) => {
  const usuario = usuariosRepo.buscarPorId(dados.usuario_id);
  if (!usuario) throw new ErroApp(404, "Usuário não encontrado");
  if (usuario.perfil !== "usuario") throw new ErroApp(403, "Só usuários podem marcar atendimentos");

  const horario = horarioDisponivel(dados.horario_id);

  const servico = servicosRepo.buscarPorId(dados.servico_id);
  if (!servico || !servico.ativo) throw new ErroApp(404, "Serviço não encontrado");
  if (servico.voluntario_id !== horario.voluntario_id) {
    throw new ErroApp(400, "Este serviço não é oferecido pelo voluntário deste horário");
  }

  if (repo.contarConfirmados(usuario.id) >= LIMITE_CONFIRMADOS) {
    throw new ErroApp(409, `Você já tem ${LIMITE_CONFIRMADOS} agendamentos confirmados. Cancele um para marcar outro.`);
  }

  const id = repo.criar(dados);
  horariosRepo.mudarStatus(horario.id, "reservado");
  return buscar(id);
});

const atualizar = db.transaction((id, dados) => {
  const atual = buscar(id);

  if (atual.status !== "confirmado") {
    throw new ErroApp(409, "Só é possível alterar agendamentos confirmados");
  }

  if (dados.horario_id && dados.horario_id !== atual.horario.id) {
    const novo = horarioDisponivel(dados.horario_id);
    if (novo.voluntario_id !== atual.voluntario.id) {
      throw new ErroApp(400, "Só é possível remarcar com o mesmo voluntário");
    }

    horariosRepo.mudarStatus(atual.horario.id, "livre");
    horariosRepo.mudarStatus(novo.id, "reservado");
    repo.atualizar(id, { horario_id: novo.id });
  }

  if (dados.status === "realizado") {
    const horario = horariosRepo.buscarPorId(dados.horario_id ?? atual.horario.id);
    if (!jaTerminou(horario)) {
      throw new ErroApp(400, "Só é possível marcar como realizado depois do horário do atendimento");
    }
    repo.atualizar(id, { status: "realizado" });
  }

  if (dados.descricao) {
    repo.atualizar(id, { descricao: dados.descricao });
  }

  return buscar(id);
});

// cancelar nao apaga: muda o status e devolve o horario para a agenda
const cancelar = db.transaction((id) => {
  const atual = buscar(id);

  if (atual.status !== "confirmado") {
    throw new ErroApp(409, "Só é possível cancelar agendamentos confirmados");
  }

  repo.atualizar(id, { status: "cancelado" });
  horariosRepo.mudarStatus(atual.horario.id, "livre");
  return buscar(id);
});

module.exports = { listar, buscar, criar, atualizar, cancelar };
