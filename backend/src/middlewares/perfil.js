// usar depois do autenticar: exigirPerfil("voluntario")
function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.usuario?.perfil)) {
      return res.status(403).json({ erro: "Você não tem permissão para fazer isso", detalhes: [] });
    }
    next();
  };
}

module.exports = exigirPerfil;
