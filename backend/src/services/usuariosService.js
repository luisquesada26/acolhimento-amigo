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

function listar(filtros) {
  return repo.listar(filtros).map((u) => ({ ...u, aceite_lgpd: Boolean(u.aceite_lgpd) }));
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

async function atualizar(id, dados) {
  buscar(id);

  if (dados.email) {
    const outro = repo.buscarPorEmail(dados.email);
    if (outro && outro.id !== id) throw new ErroApp(409, "Este e-mail já está cadastrado");
  }

  const { senha, ...campos } = dados;
  if (senha) campos.senha_hash = await bcrypt.hash(senha, 10);

  repo.atualizar(id, campos);
  return buscar(id);
}

const excluir = db.transaction((id) => {
  buscar(id);
  // antes de apagar a conta, os horarios reservados voltam a ficar livres
  agendamentosRepo.liberarHorariosDoUsuario(id);
  repo.excluir(id);
});

module.exports = { listar, buscar, criar, atualizar, excluir };
