const db = require("../database/conexao");
const repo = require("../repositories/horariosRepository");
const { voluntarioLogado, garantirDono } = require("./permissoes");
const { ErroApp } = require("../middlewares/erros");
const { agora } = require("../utils/datas");

function formatar(h) {
  const {
    agendamento_id,
    agendamento_status,
    agendamento_usuario,
    agendamento_servico,
    agendamento_descricao,
    ...horario
  } = h;

  horario.agendamento = agendamento_id
    ? {
        id: agendamento_id,
        status: agendamento_status,
        usuario: agendamento_usuario,
        servico: agendamento_servico,
        descricao: agendamento_descricao,
      }
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

function buscarSimples(id) {
  const horario = repo.buscarPorId(id);
  if (!horario) throw new ErroApp(404, "Horário não encontrado");
  return horario;
}

// agenda do voluntario logado, com o agendamento de cada horario reservado
function meus(usuario, filtros) {
  const voluntario = voluntarioLogado(usuario);
  return repo.listar({ ...filtros, voluntario_id: voluntario.id }).map(formatar);
}

function criar(usuario, dados) {
  const novo = { ...dados, voluntario_id: voluntarioLogado(usuario).id };
  validarHorario(novo);
  return formatar(repo.criar(novo));
}

function atualizar(usuario, id, dados) {
  const atual = buscarSimples(id);
  garantirDono(atual.voluntario_id, usuario);

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
const excluir = db.transaction((usuario, id, confirmar) => {
  const horario = buscarSimples(id);
  garantirDono(horario.voluntario_id, usuario);

  if (horario.status === "reservado" && !confirmar) {
    throw new ErroApp(409, "Este horário já tem um agendamento. Confirme para excluir mesmo assim.", {
      precisaConfirmar: true,
    });
  }

  repo.excluir(id);
});

module.exports = { meus, criar, atualizar, excluir };
