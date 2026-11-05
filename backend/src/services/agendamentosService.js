const { transacao, travar } = require("../database/conexao");
const repo = require("../repositories/agendamentosRepository");
const horariosRepo = require("../repositories/horariosRepository");
const servicosRepo = require("../repositories/servicosRepository");
const usuariosRepo = require("../repositories/usuariosRepository");
const voluntariosRepo = require("../repositories/voluntariosRepository");
const { voluntarioLogado } = require("./permissoes");
const { ErroApp } = require("../middlewares/erros");
const { agora } = require("../utils/datas");
const videochamada = require("./videochamada");

function formatar(a) {
  return {
    id: a.id,
    status: a.status,
    descricao: a.descricao,
    anotacao: a.anotacao,
    link_video: a.link_video,
    criado_em: a.criado_em,
    horario: { id: a.horario_id, data: a.data, hora_inicio: a.hora_inicio, hora_fim: a.hora_fim },
    voluntario: { id: a.voluntario_id, nome: a.voluntario_nome, foto: a.voluntario_foto, area: a.voluntario_area },
    servico: { id: a.servico_id, titulo: a.servico_titulo, traducoes: a.servico_traducoes },
    usuario: {
      id: a.usuario_id,
      nome: a.usuario_nome,
      email: a.usuario_email,
      telefone: a.usuario_telefone,
      foto: a.usuario_foto,
      pais_origem: a.usuario_pais,
      idiomas: a.usuario_idiomas.split(","),
    },
  };
}

function jaComecou(horario) {
  const { hoje, hora } = agora();
  return horario.data < hoje || (horario.data === hoje && horario.hora_inicio <= hora);
}

async function horarioDisponivel(horarioId) {
  const horario = await horariosRepo.buscarPorId(horarioId);
  if (!horario) throw new ErroApp(404, "Horário não encontrado");
  if (jaComecou(horario)) throw new ErroApp(400, "Este horário já passou. Escolha outro.");
  if (horario.status !== "livre") {
    throw new ErroApp(409, "Este horário acabou de ser reservado. Escolha outro.");
  }
  return horario;
}

// outro pedido pode ter reservado (ou o voluntário excluído) o mesmo horário entre a conferência acima e aqui
async function reservar(horarioId) {
  if (!(await horariosRepo.reservar(horarioId))) {
    if (!(await horariosRepo.buscarPorId(horarioId))) throw new ErroApp(404, "Horário não encontrado");
    throw new ErroApp(409, "Este horário acabou de ser reservado. Escolha outro.");
  }
}

async function buscar(id, opcoes) {
  const agendamento = await repo.buscarPorId(id, opcoes);
  if (!agendamento) throw new ErroApp(404, "Agendamento não encontrado");
  return formatar(agendamento);
}

// so quem marcou e o voluntario do horario enxergam o agendamento (e a descricao do caso)
async function ehParticipante(agendamento, usuario) {
  if (usuario.perfil === "usuario") return agendamento.usuario.id === usuario.id;
  const voluntario = await voluntariosRepo.buscarPorUsuarioId(usuario.id);
  return Boolean(voluntario) && agendamento.voluntario.id === voluntario.id;
}

async function buscarPara(usuario, id, opcoes) {
  const agendamento = await buscar(id, opcoes);
  if (!(await ehParticipante(agendamento, usuario))) {
    throw new ErroApp(403, "Você não tem acesso a este agendamento");
  }
  return agendamento;
}

// usuario ve os que marcou, voluntario ve os da agenda dele
async function meus(usuario, { status }) {
  const filtros = usuario.perfil === "usuario"
    ? { usuario_id: usuario.id, status }
    : { voluntario_id: (await voluntarioLogado(usuario)).id, status };
  return (await repo.listar(filtros)).map(formatar);
}

// os atendimentos do usuário ficam travados até o fim: dois pedidos dele ao mesmo tempo
// passam um de cada vez pela conferência de conflito
const criar = (logado, dados) =>
  transacao(async () => {
    await travar("usuario", logado.id);
    const usuario = await usuariosRepo.buscarPorId(logado.id);
    if (!usuario) throw new ErroApp(404, "Usuário não encontrado");
    if (usuario.perfil !== "usuario") throw new ErroApp(403, "Só usuários podem marcar atendimentos");

    const horario = await horarioDisponivel(dados.horario_id);
    // fora da busca (desligado ou com o perfil incompleto) não entra agendamento novo; os que já existem ficam
    if (!(await voluntariosRepo.estaNaBusca(horario.voluntario_id))) {
      throw new ErroApp(409, "Este voluntário não está recebendo agendamentos agora");
    }

    const servico = await servicosRepo.buscarPorId(dados.servico_id, { trava: "compartilhada" });
    if (!servico || !servico.ativo) throw new ErroApp(404, "Serviço não encontrado");
    if (servico.voluntario_id !== horario.voluntario_id) {
      throw new ErroApp(400, "Este serviço não é oferecido pelo voluntário deste horário");
    }
    if (await repo.temConflito(usuario.id, horario)) {
      throw new ErroApp(409, "Você já tem um atendimento nesse horário");
    }

    await reservar(horario.id);
    const id = await repo.criar({ ...dados, usuario_id: usuario.id });
    return buscar(id);
  });

// o agendamento fica travado: remarcar e cancelar ao mesmo tempo (duas abas) passam um de cada vez
const atualizar = (usuario, id, dados) =>
  transacao(async () => {
    if (dados.horario_id && usuario.perfil === "usuario") await travar("usuario", usuario.id);
    const atual = await buscarPara(usuario, id, { travar: true });

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
      const novo = await horarioDisponivel(dados.horario_id);
      if (novo.voluntario_id !== atual.voluntario.id) {
        throw new ErroApp(400, "Só é possível remarcar com o mesmo voluntário");
      }
      if (await repo.temConflito(atual.usuario.id, novo, id)) {
        throw new ErroApp(409, "Você já tem um atendimento nesse horário");
      }

      await horariosRepo.mudarStatus(atual.horario.id, "livre");
      await reservar(novo.id);
      await repo.atualizar(id, { horario_id: novo.id });
    }

    // o voluntário conclui quando a chamada acaba, sem esperar o fim do horário marcado
    if (dados.status === "realizado") {
      await repo.atualizar(id, { status: "realizado" });
    }

    if (dados.descricao) {
      await repo.atualizar(id, { descricao: dados.descricao });
    }

    if (dados.anotacao !== undefined) {
      await repo.atualizar(id, { anotacao: dados.anotacao || null });
    }

    return buscar(id);
  });

// cancelar nao apaga: muda o status e devolve o horario para a agenda
const cancelar = (usuario, id) =>
  transacao(async () => {
    const atual = await buscarPara(usuario, id, { travar: true });

    if (atual.status !== "confirmado") {
      throw new ErroApp(409, "Só é possível cancelar agendamentos confirmados");
    }

    await repo.atualizar(id, { status: "cancelado" });
    await horariosRepo.mudarStatus(atual.horario.id, "livre");
    return buscar(id);
  });

// a sala do Meet fica fora da transação: o agendamento vale mesmo se o Google falhar,
// e o botão da videochamada cria a sala depois (garantirSala)
async function abrirSala(id) {
  const a = await repo.buscarPorId(id);
  // sobrou um evento sem link (falhou no meio do caminho): sai da agenda antes de criar o novo
  if (a.google_evento_id) await videochamada.apagarSalas([a.google_evento_id]);
  const sala = await videochamada.criarSala(a);
  await repo.atualizar(id, { link_video: sala.link, google_evento_id: sala.eventoId });
}

async function criarComSala(logado, dados) {
  const agendamento = await criar(logado, dados);
  if (videochamada.ligado) {
    try {
      await abrirSala(agendamento.id);
    } catch (erro) {
      console.error(`Sala do Meet não criada para o agendamento ${agendamento.id}: ${erro.message}`);
    }
  }
  return buscar(agendamento.id);
}

async function atualizarComSala(usuario, id, dados) {
  const atualizado = await atualizar(usuario, id, dados);
  const { google_evento_id: eventoId } = await repo.buscarPorId(id);
  if (dados.horario_id && eventoId) {
    try {
      await videochamada.moverSala(eventoId, atualizado.horario);
    } catch (erro) {
      console.error(`Sala do Meet não remarcada no agendamento ${id}: ${erro.message}`);
    }
  }
  return atualizado;
}

async function cancelarComSala(usuario, id) {
  await cancelar(usuario, id);
  const { google_evento_id: eventoId } = await repo.buscarPorId(id);
  if (eventoId) {
    await videochamada.apagarSalas([eventoId]);
    await repo.atualizar(id, { link_video: null, google_evento_id: null });
  }
  return buscar(id);
}

// o botão da videochamada chama aqui quando o agendamento ainda não tem sala (os do seed, ou se o Google falhou ao marcar)
async function garantirSala(usuario, id) {
  const atual = await buscarPara(usuario, id);
  if (atual.status !== "confirmado") {
    throw new ErroApp(409, "A videochamada só existe para atendimentos confirmados");
  }
  if (atual.link_video) return atual;
  if (!videochamada.ligado) {
    throw new ErroApp(503, "A videochamada não está configurada neste servidor");
  }
  try {
    await abrirSala(id);
  } catch (erro) {
    console.error(`Sala do Meet não criada para o agendamento ${id}: ${erro.message}`);
    throw new ErroApp(502, "Não foi possível criar a sala da videochamada. Tente de novo.");
  }
  return buscar(id);
}

module.exports = { meus, buscarPara, criar, atualizar, cancelar, criarComSala, atualizarComSala, cancelarComSala, garantirSala };
