const voluntariosRepo = require("../repositories/voluntariosRepository");
const { ErroApp } = require("../middlewares/erros");

// cadastro de voluntario de quem esta logado
function voluntarioLogado(usuario) {
  const voluntario = voluntariosRepo.buscarPorUsuarioId(usuario.id);
  if (!voluntario) throw new ErroApp(403, "Só voluntários podem fazer isso");
  return voluntario;
}

function garantirDono(voluntarioId, usuario) {
  if (voluntarioLogado(usuario).id !== voluntarioId) {
    throw new ErroApp(403, "Você só pode alterar o que é seu");
  }
}

module.exports = { voluntarioLogado, garantirDono };
