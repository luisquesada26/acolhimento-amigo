import { localeAtual } from "../context/IdiomaContext";

// o país de origem é texto livre no banco ("Colômbia", "Síria"...). Aqui ele é reconhecido pelo nome
// em qualquer um dos 4 idiomas e volta no idioma da bandeira; o que não for país aparece como foi digitado
const LOCALES = ["pt-BR", "en", "es", "fr"];

// sem diferenciar maiúscula, acento, espaço e pontuação: "colombia" e "Colômbia" são o mesmo país
function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

// nome normalizado em qualquer idioma -> código ISO; montado uma vez só, na primeira consulta
let codigos = null;

function codigoDe(texto) {
  if (!codigos) {
    codigos = new Map();
    const nomes = LOCALES.map((locale) => new Intl.DisplayNames([locale], { type: "region", fallback: "none" }));
    for (let a = 65; a <= 90; a++) {
      for (let b = 65; b <= 90; b++) {
        const codigo = String.fromCharCode(a, b);
        // código antigo (DD, UK, SU...) tem o mesmo nome do atual: fica só o atual
        if (Intl.getCanonicalLocales(`und-${codigo}`)[0] !== `und-${codigo}`) continue;
        for (const lista of nomes) {
          const nome = lista.of(codigo);
          if (nome) codigos.set(normalizar(nome), codigo);
        }
      }
    }
  }
  return codigos.get(normalizar(texto));
}

const nomesPorLocale = {};

// "Colômbia", "colombia" ou "Colombie" viram "Colombia" com a bandeira em inglês
export function nomeDoPais(texto) {
  if (!texto) return texto;
  const codigo = codigoDe(texto);
  if (!codigo) return texto;
  const locale = localeAtual();
  nomesPorLocale[locale] ??= new Intl.DisplayNames([locale], { type: "region" });
  return nomesPorLocale[locale].of(codigo);
}

// o mesmo país escrito de jeitos diferentes tem a mesma chave: o código ISO ou, se não for país, o texto normalizado
export function chaveDoPais(texto) {
  if (!texto) return "";
  return codigoDe(texto) ?? `texto:${normalizar(texto)}`;
}
