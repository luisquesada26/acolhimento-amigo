const { TRADUCAO } = require("../config/env");

// a bio do voluntário e o título e a descrição do serviço, nos 4 idiomas do site, pelo MyMemory.
// Só esses textos saem daqui: nada mais da pessoa vai para o tradutor

// idioma do site e o código que o MyMemory entende
const ALVOS = { pt: "pt-BR", en: "en", es: "es", fr: "fr" };
// o MyMemory aceita até 500 bytes por pedido
const LIMITE = 500;

const bytes = (texto) => Buffer.byteLength(texto, "utf8");

// texto maior que o limite quebra em frases; frase maior, em palavras; palavra maior, em letras
const NIVEIS = [
  (texto) => [...new Intl.Segmenter("pt", { granularity: "sentence" }).segment(texto)].map((s) => s.segment),
  (texto) => texto.match(/\s+|\S+\s*/g),
  (texto) => Array.from(texto),
];

// pedaços de até 500 bytes que, juntos, dão o texto de volta sem perder nem um espaço
function dividir(texto, nivel = 0) {
  if (bytes(texto) <= LIMITE) return [texto];

  const pedacos = [];
  let atual = "";
  for (const parte of NIVEIS[nivel](texto).flatMap((p) => dividir(p, nivel + 1))) {
    if (atual && bytes(atual + parte) > LIMITE) {
      pedacos.push(atual);
      atual = "";
    }
    atual += parte;
  }
  if (atual) pedacos.push(atual);
  return pedacos;
}

// o MyMemory às vezes devolve o apóstrofo e as aspas como entidade HTML (&#39;)
const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decodificar = (texto) =>
  texto.replace(/&(#\d+|#x[\da-f]+|amp|lt|gt|quot|apos);/gi, (inteira, nome) => {
    if (nome[0] !== "#") return ENTIDADES[nome.toLowerCase()];
    const codigo = nome[1].toLowerCase() === "x" ? parseInt(nome.slice(2), 16) : Number(nome.slice(1));
    return codigo > 0 && codigo <= 0x10ffff ? String.fromCodePoint(codigo) : inteira;
  });

const mesmoIdioma = (a, b) => a.split("-")[0].toLowerCase() === b.split("-")[0].toLowerCase();

// um pedaço num idioma; qualquer problema vira erro, e quem chama desiste da tradução inteira
// o autodetect do MyMemory às vezes responde com o corpo vazio: aí vai de novo, supondo português,
// que é a língua de quase todo o conteúdo. Timeout não repete, para o salvar não esperar o dobro
async function pedir(texto, alvo) {
  try {
    return await pedirPar(texto, "autodetect", alvo);
  } catch (erro) {
    if (erro.name === "TimeoutError" || erro.name === "AbortError") throw erro;
    return alvo === ALVOS.pt ? texto : pedirPar(texto, ALVOS.pt, alvo);
  }
}

async function pedirPar(texto, origem, alvo) {
  const parametros = new URLSearchParams({ q: texto, langpair: `${origem}|${alvo}` });
  if (TRADUCAO.email) parametros.set("de", TRADUCAO.email);

  const resposta = await fetch(`${TRADUCAO.url}?${parametros}`, { signal: AbortSignal.timeout(TRADUCAO.esperaMs) });
  if (!resposta.ok) throw new Error(`o tradutor respondeu ${resposta.status}`);
  // sem cota, o MyMemory também pode responder 200 com o corpo vazio: o json() falha e vira erro
  const dados = await resposta.json();

  // texto já no idioma pedido: o MyMemory recusa traduzir para o mesmo idioma
  if (/DISTINCT LANGUAGES/i.test(dados.responseDetails ?? "")) return texto;
  if (dados.quotaFinished) throw new Error("o limite diário do tradutor acabou");
  if (Number(dados.responseStatus) !== 200) throw new Error(`o tradutor recusou (${dados.responseStatus})`);

  const detectado = dados.responseData?.detectedLanguage;
  if (typeof detectado === "string" && mesmoIdioma(detectado, alvo)) return texto;

  const traduzido = dados.responseData?.translatedText;
  if (typeof traduzido !== "string" || !traduzido.trim() || /^MYMEMORY WARNING/i.test(traduzido)) {
    throw new Error("o tradutor não devolveu o texto");
  }
  return decodificar(traduzido.trim());
}

// os espaços e quebras de linha das pontas ficam como estavam; só o miolo vai para o tradutor
async function traduzirPedaco(pedaco, alvo) {
  const [, antes, miolo, depois] = pedaco.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return miolo ? antes + (await pedir(miolo, alvo)) + depois : pedaco;
}

// { origem, pt, en, es, fr }, com os 4 pedidos ao mesmo tempo; null se qualquer um falhar
async function traduzir(texto) {
  if (TRADUCAO.desligada || typeof texto !== "string" || !texto.trim()) return null;

  const pedacos = dividir(texto);
  try {
    const idiomas = await Promise.all(
      Object.entries(ALVOS).map(async ([idioma, alvo]) => {
        const partes = await Promise.all(pedacos.map((pedaco) => traduzirPedaco(pedaco, alvo)));
        return [idioma, partes.join("")];
      })
    );
    return { origem: texto, ...Object.fromEntries(idiomas) };
  } catch (erro) {
    console.error(`Tradução não feita, fica o texto original: ${erro.message}`);
    return null;
  }
}

// as traduções que mudam ao gravar estes campos: { campo: tradução, ou null para tirar a dele }.
// Campo que não veio fica de fora, e campo que já tem a tradução deste mesmo texto também.
// Quem chama faz isto antes de abrir a transação: o tradutor pode levar alguns segundos
async function traduzirCampos(campos, traducoesAtuais) {
  const mudancas = {};
  await Promise.all(
    Object.entries(campos).map(async ([campo, texto]) => {
      if (texto === undefined) return;
      if (texto && traducoesAtuais?.[campo]?.origem === texto) return;
      mudancas[campo] = texto ? await traduzir(texto) : null;
    })
  );
  return mudancas;
}

module.exports = { traduzir, traduzirCampos, dividir, LIMITE };
