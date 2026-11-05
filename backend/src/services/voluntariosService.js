const repo = require("../repositories/voluntariosRepository");
const { ErroApp } = require("../middlewares/erros");

// cadastro, edicao e exclusao do voluntario ficam em /auth/cadastro e /me

// o que falta no perfil, no formato dos erros de validacao: o campo e a mensagem de cada item
const FALTA = {
  nacionalidade: { campo: "pais_origem", mensagem: "Informe a nacionalidade" },
  idiomas: { campo: "voluntario.idiomas", mensagem: "Informe pelo menos um idioma" },
  bio: { campo: "voluntario.bio", mensagem: "Escreva o Sobre você" },
  servico: { campo: "servicos", mensagem: "Crie pelo menos um serviço ativo" },
  horario: { campo: "horarios", mensagem: "Abra pelo menos um horário livre na agenda" },
};

function formatar(v) {
  return { ...v, idiomas: v.idiomas ? v.idiomas.split(",") : [], ativo: Boolean(v.ativo) };
}

// cada voluntario ja vem com os servicos ({ id, titulo }) e o proximo_horario
async function listar(filtros) {
  return (await repo.listar(filtros)).map(formatar);
}

// fora da busca o perfil continua aberto (quem ja marcou ve com quem foi), mas sem horario para marcar
async function buscar(id) {
  const v = await repo.buscarPorId(id);
  if (!v) throw new ErroApp(404, "Voluntário não encontrado");
  return {
    ...formatar(v),
    servicos: await repo.servicosAtivos(id),
    horarios: v.na_busca ? await repo.horariosLivres(id) : [],
  };
}

// os 5 itens do perfil completo e se ele aparece na busca agora (ativo e com o perfil pronto para a busca)
async function situacaoNaBusca(id) {
  const { na_busca, ...requisitos } = await repo.requisitos(id);
  return { requisitos, perfil_completo: Object.values(requisitos).every(Boolean), na_busca };
}

// so liga a busca quem tem os 5 itens prontos
async function garantirPerfilCompleto(id) {
  const { requisitos } = await situacaoNaBusca(id);
  const detalhes = Object.keys(requisitos)
    .filter((item) => !requisitos[item])
    .map((item) => FALTA[item]);
  if (detalhes.length) throw new ErroApp(400, "Complete o perfil para aparecer na busca", { detalhes });
}

module.exports = { listar, buscar, situacaoNaBusca, garantirPerfilCompleto };
