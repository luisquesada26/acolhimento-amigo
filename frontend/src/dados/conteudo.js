// a bio do voluntário e o título e a descrição do serviço no idioma da bandeira.
// A tradução vem da API em objeto.traducoes e só vale se foi feita deste mesmo texto (origem):
// se o voluntário editou e a tradução nova ainda não chegou, aparece o que ele escreveu.
// Quem chama passa o idioma do useIdioma(), para a tela trocar junto com a bandeira
export function traduzido(objeto, campo, idioma) {
  const texto = objeto?.[campo];
  const traducao = objeto?.traducoes?.[campo];
  if (!texto || traducao?.origem !== texto) return texto;
  return traducao[idioma] || texto;
}

// o que a pessoa escreveu (o caso, a anotação) fica como foi escrito: o layout põe o lang
// da bandeira no contêiner, e sem isto o tradutor do navegador traduziria esses textos também
export const COMO_ESCRITO = { translate: "no", className: "notranslate", lang: "" };
