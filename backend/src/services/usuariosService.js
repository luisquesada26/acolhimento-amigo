const bcrypt = require("bcrypt");
const db = require("../database/conexao");
const repo = require("../repositories/usuariosRepository");
const voluntariosRepo = require("../repositories/voluntariosRepository");
const areasRepo = require("../repositories/areasRepository");
const agendamentosRepo = require("../repositories/agendamentosRepository");
const { ErroApp } = require("../middlewares/erros");

function montar(usuario) {
  const resultado = { ...usuario, aceite_lgpd: Boolean(usuario.aceite_lgpd) };

  if (usuario.perfil === "voluntario") {
    const v = voluntariosRepo.buscarPorUsuarioId(usuario.id);
    if (v) {
      resultado.voluntario = {
        id: v.id,
        area_id: v.area_id,
        registro_profissional: v.registro_profissional,
        idiomas: v.idiomas.split(","),
        bio: v.bio,
        ativo: Boolean(v.ativo),
      };
    }
  }
  return resultado;
}

function buscar(id) {
  const usuario = repo.buscarPorId(id);
  if (!usuario) throw new ErroApp(404, "Usuário não encontrado");
  return montar(usuario);
}

async function criar(dados) {
  if (repo.buscarPorEmail(dados.email)) {
    throw new ErroApp(409, "Este e-mail já está cadastrado");
  }
  if (dados.perfil === "voluntario" && !areasRepo.buscarPorId(dados.voluntario.area_id)) {
    throw new ErroApp(400, "Área não encontrada");
  }

  const senha_hash = await bcrypt.hash(dados.senha, 10);

  const salvar = db.transaction(() => {
    const id = repo.criar({
      nome: dados.nome,
      email: dados.email,
      senha_hash,
      telefone: dados.telefone ?? null,
      perfil: dados.perfil,
      pais_origem: dados.pais_origem ?? null,
      idioma: dados.idioma,
      aceite_lgpd: 1,
    });

    if (dados.perfil === "voluntario") {
      voluntariosRepo.criar({
        usuario_id: id,
        area_id: dados.voluntario.area_id,
        registro_profissional: dados.voluntario.registro_profissional ?? null,
        idiomas: dados.voluntario.idiomas.join(","),
        bio: dados.voluntario.bio ?? null,
      });
    }
    return id;
  });

  return buscar(salvar());
}

// o voluntario edita tambem os dados profissionais pelo mesmo PUT /me
async function atualizar(id, dados) {
  const usuario = buscar(id);
  const { senha, voluntario, ...campos } = dados;

  if (campos.email) {
    const outro = repo.buscarPorEmail(campos.email);
    if (outro && outro.id !== id) throw new ErroApp(409, "Este e-mail já está cadastrado");
  }

  if (voluntario && usuario.perfil !== "voluntario") {
    throw new ErroApp(400, "Só voluntários têm dados profissionais");
  }
  if (voluntario?.area_id && !areasRepo.buscarPorId(voluntario.area_id)) {
    throw new ErroApp(400, "Área não encontrada");
  }

  if (senha) campos.senha_hash = await bcrypt.hash(senha, 10);

  const camposVoluntario = { ...voluntario };
  if (camposVoluntario.idiomas) camposVoluntario.idiomas = camposVoluntario.idiomas.join(",");
  if (camposVoluntario.ativo !== undefined) camposVoluntario.ativo = camposVoluntario.ativo ? 1 : 0;

  db.transaction(() => {
    repo.atualizar(id, campos);
    if (voluntario) voluntariosRepo.atualizar(usuario.voluntario.id, camposVoluntario);
  })();

  return buscar(id);
}

const excluir = db.transaction((id) => {
  buscar(id);
  // antes de apagar a conta, os horarios reservados voltam a ficar livres
  agendamentosRepo.liberarHorariosDoUsuario(id);
  repo.excluir(id);
});

module.exports = { buscar, criar, atualizar, excluir };
