const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const usuariosRepo = require("../repositories/usuariosRepository");
const usuariosService = require("./usuariosService");
const { ErroApp } = require("../middlewares/erros");
const { JWT_SECRET, JWT_EXPIRA_EM } = require("../config/env");

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id, perfil: usuario.perfil }, JWT_SECRET, { expiresIn: JWT_EXPIRA_EM });
}

async function cadastrar(dados) {
  const usuario = await usuariosService.criar(dados);
  return { token: gerarToken(usuario), usuario };
}

async function login({ email, senha }) {
  const encontrado = usuariosRepo.buscarSenhaPorEmail(email);

  // mesma mensagem para e-mail e senha errados, para nao revelar quem tem conta
  const senhaCerta = encontrado && (await bcrypt.compare(senha, encontrado.senha_hash));
  if (!senhaCerta) {
    throw new ErroApp(401, "E-mail ou senha incorretos");
  }

  const usuario = usuariosService.buscar(encontrado.id);
  return { token: gerarToken(usuario), usuario };
}

module.exports = { cadastrar, login };
