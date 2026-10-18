const service = require("../services/authService");

async function cadastrar(req, res) {
  res.status(201).json(await service.cadastrar(req.body));
}

async function login(req, res) {
  res.json(await service.login(req.body));
}

module.exports = { cadastrar, login };
