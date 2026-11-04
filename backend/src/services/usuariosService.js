const bcrypt = require("bcrypt");
const { transacao } = require("../database/conexao");
const repo = require("../repositories/usuariosRepository");
const voluntariosRepo = require("../repositories/voluntariosRepository");
const areasRepo = require("../repositories/areasRepository");
const agendamentosRepo = require("../repositories/agendamentosRepository");
const { ErroApp } = require("../middlewares/erros");
const videochamada = require("./videochamada");
const traducao = require("./traducao");

async function montar(usuario) {
  const resultado = { ...usuario, idiomas: usuario.idiomas.split(","), aceite_lgpd: Boolean(usuario.aceite_lgpd) };

  if (usuario.perfil === "voluntario") {
    const v = await voluntariosRepo.buscarPorUsuarioId(usuario.id);
    if (v) {
      resultado.voluntario = {
        id: v.id,
        area_id: v.area_id,
        registro_profissional: v.registro_profissional,
        idiomas: v.idiomas ? v.idiomas.split(",") : [],
        bio: v.bio,
        traducoes: v.traducoes,
        ativo: Boolean(v.ativo),
      };
    }
  }
  return resultado;
}

async function buscar(id) {
  const usuario = await repo.buscarPorId(id);
  if (!usuario) throw new ErroApp(404, "Usuário não encontrado");
  return montar(usuario);
}

async function criar(dados) {
  if (await repo.buscarPorEmail(dados.email)) {
    throw new ErroApp(409, "Este e-mail já está cadastrado");
  }
  if (dados.perfil === "voluntario" && !(await areasRepo.buscarPorId(dados.voluntario.area_id))) {
    throw new ErroApp(400, "Área não encontrada");
  }

  const senha_hash = await bcrypt.hash(dados.senha, 10);
  // a bio vai para o tradutor antes da transação, e o cadastro não espera nada dele para valer
  const traducoes = dados.perfil === "voluntario" ? await traducao.traduzirCampos({ bio: dados.voluntario.bio }) : {};

  const salvar = () => transacao(async () => {
    const id = await repo.criar({
      nome: dados.nome,
      email: dados.email,
      senha_hash,
      telefone: dados.telefone ?? null,
      perfil: dados.perfil,
      pais_origem: dados.pais_origem ?? null,
      idiomas: dados.idiomas.join(","),
      aceite_lgpd: 1,
    });

    if (dados.perfil === "voluntario") {
      await voluntariosRepo.criar({
        usuario_id: id,
        area_id: dados.voluntario.area_id,
        registro_profissional: dados.voluntario.registro_profissional ?? null,
        idiomas: (dados.voluntario.idiomas ?? []).join(","),
        bio: dados.voluntario.bio ?? null,
        traducoes,
      });
    }
    return id;
  });

  return buscar(await salvar());
}

// o voluntario edita tambem os dados profissionais pelo mesmo PUT /me
async function atualizar(id, dados) {
  const usuario = await buscar(id);
  const { senha, voluntario, ...campos } = dados;

  if (campos.email) {
    const outro = await repo.buscarPorEmail(campos.email);
    if (outro && outro.id !== id) throw new ErroApp(409, "Este e-mail já está cadastrado");
  }

  if (voluntario && usuario.perfil !== "voluntario") {
    throw new ErroApp(400, "Só voluntários têm dados profissionais");
  }
  if (voluntario?.area_id && !(await areasRepo.buscarPorId(voluntario.area_id))) {
    throw new ErroApp(400, "Área não encontrada");
  }

  if (senha) campos.senha_hash = await bcrypt.hash(senha, 10);
  if (campos.idiomas) campos.idiomas = campos.idiomas.join(",");

  const camposVoluntario = { ...voluntario };
  if (camposVoluntario.idiomas) camposVoluntario.idiomas = camposVoluntario.idiomas.join(",");
  if (camposVoluntario.ativo !== undefined) camposVoluntario.ativo = camposVoluntario.ativo ? 1 : 0;
  // só a bio nova ou mudada vai para o tradutor, antes da transação
  const traducoes = voluntario ? await traducao.traduzirCampos({ bio: voluntario.bio }, usuario.voluntario.traducoes) : {};

  await transacao(async () => {
    await repo.atualizar(id, campos);
    if (voluntario) await voluntariosRepo.atualizar(usuario.voluntario.id, camposVoluntario, traducoes);
  });

  return buscar(id);
}

const excluir = (id) =>
  transacao(async () => {
    await buscar(id);
    // antes de apagar a conta, os horarios reservados voltam a ficar livres
    await agendamentosRepo.liberarHorariosDoUsuario(id);
    await repo.excluir(id);
  });

async function excluirComSalas(id) {
  const salas = await agendamentosRepo.salasDaConta(id);
  await excluir(id);
  await videochamada.apagarSalas(salas);
}

module.exports = { buscar, criar, atualizar, excluir, excluirComSalas };
