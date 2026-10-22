const db = require("../database/conexao");
const repo = require("../repositories/agendamentosRepository");
const horariosRepo = require("../repositories/horariosRepository");
const servicosRepo = require("../repositories/servicosRepository");
const usuariosRepo = require("../repositories/usuariosRepository");
const voluntariosRepo = require("../repositories/voluntariosRepository");
const { voluntarioLogado } = require("./permissoes");
const { ErroApp } = require("../middlewares/erros");
const { agora } = require("../utils/datas");

const LIMITE_CONFIRMADOS = 3;

function formatar(a) {
  return {
    id: a.id,
    status: a.status,
    descricao: a.descricao,
    anotacao: a.anotacao,
    criado_em: a.criado_em,
    horario: { id: a.horario_id, data: a.data, hora_inicio: a.hora_inicio, hora_fim: a.hora_fim },
    voluntario: { id: a.voluntario_id, nome: a.voluntario_nome },
    servico: { id: a.servico_id, titulo: a.servico_titulo },
    usuario: {
      id: a.usuario_id,
      nome: a.usuario_nome,
      email: a.usuario_email,
      telefone: a.usuario_telefone,
      foto: a.usuario_foto,
      pais_origem: a.usuario_pais,
      idioma: a.usuario_idioma,
    },
  };
}

function jaComecou(horario) {
  const { hoje, hora } = agora();
  return horario.data < hoje || (horario.data === hoje && horario.hora_inicio <= hora);
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

function buscar(id) {
  const agendamento = repo.buscarPorId(id);
  if (!agendamento) throw new ErroApp(404, "Agendamento não encontrado");
  return formatar(agendamento);
}

// so quem marcou e o voluntario do horario enxergam o agendamento (e a descricao do caso)
function ehParticipante(agendamento, usuario) {
  if (usuario.perfil === "usuario") return agendamento.usuario.id === usuario.id;
  const voluntario = voluntariosRepo.buscarPorUsuarioId(usuario.id);
  return Boolean(voluntario) && agendamento.voluntario.id === voluntario.id;
}

function buscarPara(usuario, id) {
  const agendamento = buscar(id);
  if (!ehParticipante(agendamento, usuario)) {
    throw new ErroApp(403, "Você não tem acesso a este agendamento");
  }
  return agendamento;
}

// usuario ve os que marcou, voluntario ve os da agenda dele
function meus(usuario, { status }) {
  const filtros = usuario.perfil === "usuario"
    ? { usuario_id: usuario.id, status }
    : { voluntario_id: voluntarioLogado(usuario).id, status };
  return repo.listar(filtros).map(formatar);
}

const criar = db.transaction((logado, dados) => {
  const usuario = usuariosRepo.buscarPorId(logado.id);
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

  const id = repo.criar({ ...dados, usuario_id: usuario.id });
  horariosRepo.mudarStatus(horario.id, "reservado");
  return buscar(id);
});

const atualizar = db.transaction((usuario, id, dados) => {
  const atual = buscarPara(usuario, id);

  if ((dados.horario_id || dados.descricao) && usuario.perfil !== "usuario") {
    throw new ErroApp(403, "Só quem marcou o atendimento pode remarcar ou mudar a descrição");
  }
  if (dados.status === "realizado" && usuario.perfil !== "voluntario") {
    throw new ErroApp(403, "Só o voluntário pode marcar o atendimento como realizado");
  }
  if (dados.anotacao !== undefined && usuario.perfil !== "voluntario") {
    throw new ErroApp(403, "Só o voluntário escreve a anotação do atendimento");
  }

  // a anotação pode ser escrita depois de concluído; o resto só com o atendimento confirmado
  const soAnotacao = Object.keys(dados).every((campo) => campo === "anotacao");
  if (atual.status === "cancelado" || (atual.status !== "confirmado" && !soAnotacao)) {
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

  // o voluntário conclui quando a chamada acaba, sem esperar o fim do horário marcado
  if (dados.status === "realizado") {
    repo.atualizar(id, { status: "realizado" });
  }

  if (dados.descricao) {
    repo.atualizar(id, { descricao: dados.descricao });
  }

  if (dados.anotacao !== undefined) {
    repo.atualizar(id, { anotacao: dados.anotacao || null });
  }

  return buscar(id);
});

// cancelar nao apaga: muda o status e devolve o horario para a agenda
const cancelar = db.transaction((usuario, id) => {
  const atual = buscarPara(usuario, id);

  if (atual.status !== "confirmado") {
    throw new ErroApp(409, "Só é possível cancelar agendamentos confirmados");
  }

  repo.atualizar(id, { status: "cancelado" });
  horariosRepo.mudarStatus(atual.horario.id, "livre");
  return buscar(id);
});

module.exports = { meus, buscarPara, criar, atualizar, cancelar };
