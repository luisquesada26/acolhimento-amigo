const { transacao, travar } = require("../database/conexao");
const repo = require("../repositories/horariosRepository");
const { voluntarioLogado, garantirDono } = require("./permissoes");
const { ErroApp } = require("../middlewares/erros");
const { agora } = require("../utils/datas");
const agendamentosRepo = require("../repositories/agendamentosRepository");
const videochamada = require("./videochamada");

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

async function validarHorario(h, ignorarId) {
  if (h.hora_fim <= h.hora_inicio) {
    throw new ErroApp(400, "A hora de fim precisa ser depois da hora de início");
  }

  const { hoje, hora } = agora();
  if (h.data < hoje || (h.data === hoje && h.hora_inicio <= hora)) {
    throw new ErroApp(400, "Não é possível criar horário no passado");
  }

  if (await repo.existeConflito(h, ignorarId)) {
    throw new ErroApp(409, "Já existe um horário nesse período na sua agenda");
  }
}

async function buscarSimples(id, opcoes) {
  const horario = await repo.buscarPorId(id, opcoes);
  if (!horario) throw new ErroApp(404, "Horário não encontrado");
  return horario;
}

// agenda do voluntario logado, com o agendamento de cada horario reservado
async function meus(usuario, filtros) {
  const voluntario = await voluntarioLogado(usuario);
  return (await repo.listar({ ...filtros, voluntario_id: voluntario.id })).map(formatar);
}

// a agenda do voluntario fica travada ate o fim da transacao: um segundo pedido igual espera e ve o primeiro
const criar = (usuario, dados) =>
  transacao(async () => {
    const novo = { ...dados, voluntario_id: (await voluntarioLogado(usuario)).id };
    await travar("voluntario", novo.voluntario_id);
    await validarHorario(novo);
    return formatar(await repo.criar(novo));
  });

const atualizar = (usuario, id, dados) =>
  transacao(async () => {
    await travar("voluntario", (await voluntarioLogado(usuario)).id);
    const atual = await buscarSimples(id);
    await garantirDono(atual.voluntario_id, usuario);

    if (atual.status === "reservado") {
      throw new ErroApp(409, "Só é possível editar horários livres");
    }

    const novo = {
      voluntario_id: atual.voluntario_id,
      data: dados.data ?? atual.data,
      hora_inicio: dados.hora_inicio ?? atual.hora_inicio,
      hora_fim: dados.hora_fim ?? atual.hora_fim,
    };
    await validarHorario(novo, id);

    // alguem reservou depois da leitura acima: o horario nao muda
    const atualizado = await repo.atualizar(id, novo);
    if (!atualizado) throw new ErroApp(409, "Só é possível editar horários livres");
    return formatar(atualizado);
  });

// horario reservado so sai se o front confirmar, porque o agendamento ligado a ele some junto.
// O horario fica travado: uma reserva que chegar no meio espera e depois ve que ele sumiu
const excluir = (usuario, id, confirmar) =>
  transacao(async () => {
    const horario = await buscarSimples(id, { travar: true });
    await garantirDono(horario.voluntario_id, usuario);

    if (horario.status === "reservado" && !confirmar) {
      throw new ErroApp(409, "Este horário já tem um agendamento. Confirme para excluir mesmo assim.", {
        precisaConfirmar: true,
      });
    }

    await repo.excluir(id);
  });

async function excluirComSala(usuario, id, confirmar) {
  const salas = await agendamentosRepo.salasDoHorario(id);
  await excluir(usuario, id, confirmar);
  await videochamada.apagarSalas(salas);
}

module.exports = { meus, criar, atualizar, excluir, excluirComSala };
