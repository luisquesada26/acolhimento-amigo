const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || "").split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Faça login para continuar", detalhes: [] });
  }

  try {
    const { id, perfil } = jwt.verify(token, JWT_SECRET);
    req.usuario = { id, perfil };
    next();
  } catch {
    res.status(401).json({ erro: "Sessão inválida ou expirada. Faça login de novo.", detalhes: [] });
  }
}

module.exports = autenticar;
