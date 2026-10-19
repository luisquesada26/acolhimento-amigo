const db = require("../database/conexao");
const repo = require("../repositories/horariosRepository");
const voluntariosRepo = require("../repositories/voluntariosRepository");
const { ErroApp } = require("../middlewares/erros");
const { agora } = require("../utils/datas");

function formatar(h) {
  const { agendamento_id, agendamento_status, agendamento_usuario, agendamento_servico, ...horario } = h;

  horario.agendamento = agendamento_id
    ? { id: agendamento_id, status: agendamento_status, usuario: agendamento_usuario, servico: agendamento_servico }
    : null;

  return horario;
}

function validarHorario(h, ignorarId) {
  if (h.hora_fim <= h.hora_inicio) {
    throw new ErroApp(400, "A hora de fim precisa ser depois da hora de início");
  }

  const { hoje, hora } = agora();
  if (h.data < hoje || (h.data === hoje && h.hora_inicio <= hora)) {
    throw new ErroApp(400, "Não é possível criar horário no passado");
  }

  if (repo.existeConflito(h, ignorarId)) {
    throw new ErroApp(409, "Já existe um horário nesse período na sua agenda");
  }
}

function listar(filtros) {
  return repo.listar(filtros).map(formatar);
}

function buscarSimples(id) {
  const horario = repo.buscarPorId(id);
  if (!horario) throw new ErroApp(404, "Horário não encontrado");
  return horario;
}

function buscar(id) {
  return formatar(buscarSimples(id));
}

function criar(dados) {
  if (!voluntariosRepo.buscarPorId(dados.voluntario_id)) {
    throw new ErroApp(400, "Voluntário não encontrado");
  }
  validarHorario(dados);
  return formatar(repo.criar(dados));
}

function atualizar(id, dados) {
  const atual = buscarSimples(id);

  if (atual.status === "reservado") {
    throw new ErroApp(409, "Só é possível editar horários livres");
  }

  const novo = {
    voluntario_id: atual.voluntario_id,
    data: dados.data ?? atual.data,
    hora_inicio: dados.hora_inicio ?? atual.hora_inicio,
    hora_fim: dados.hora_fim ?? atual.hora_fim,
  };
  validarHorario(novo, id);

  return formatar(repo.atualizar(id, novo));
}

// horario reservado so sai se o front confirmar, porque o agendamento ligado a ele some junto
const excluir = db.transaction((id, confirmar) => {
  const horario = buscarSimples(id);

  if (horario.status === "reservado" && !confirmar) {
    throw new ErroApp(409, "Este horário já tem um agendamento. Confirme para excluir mesmo assim.", {
      precisaConfirmar: true,
    });
  }

  repo.excluir(id);
});

module.exports = { listar, buscar, criar, atualizar, excluir };
