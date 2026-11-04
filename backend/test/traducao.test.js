const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { TRADUCAO } = require("../src/config/env");
const { traduzir, traduzirCampos, dividir, LIMITE } = require("../src/services/traducao");

// fetch falso: cada pedido fica registrado e a resposta sai da função "responder"
const fetchDeVerdade = globalThis.fetch;
const configInicial = { ...TRADUCAO };
let pedidos;

function respostaJson(dados, status = 200) {
  return new Response(JSON.stringify(dados), { status, headers: { "Content-Type": "application/json" } });
}

function traducaoOk(texto, alvo, extra = {}) {
  return respostaJson({
    responseData: { translatedText: `[${alvo}] ${texto}`, match: 1, ...extra },
    quotaFinished: false,
    responseStatus: 200,
  });
}

function usarFetch(responder) {
  globalThis.fetch = async (url, opcoes) => {
    const parametros = new URL(url).searchParams;
    const pedido = { url, q: parametros.get("q"), langpair: parametros.get("langpair"), de: parametros.get("de"), opcoes };
    pedidos.push(pedido);
    return responder(pedido);
  };
}

const alvoDe = (pedido) => pedido.langpair.split("|")[1];

beforeEach(() => {
  pedidos = [];
  Object.assign(TRADUCAO, configInicial, { url: "http://tradutor.teste/get", email: undefined, desligada: false });
  // o erro esperado de cada teste não precisa sujar a saída
  console.error = () => {};
});

afterEach(() => {
  globalThis.fetch = fetchDeVerdade;
});

test("traduz para os 4 idiomas, com autodetect e um pedido por idioma", async () => {
  usarFetch((p) => traducaoOk(p.q, alvoDe(p)));

  const resultado = await traduzir("Visto e residência");

  assert.deepEqual(resultado, {
    origem: "Visto e residência",
    pt: "[pt-BR] Visto e residência",
    en: "[en] Visto e residência",
    es: "[es] Visto e residência",
    fr: "[fr] Visto e residência",
  });
  assert.deepEqual(pedidos.map((p) => p.langpair).sort(), ["autodetect|en", "autodetect|es", "autodetect|fr", "autodetect|pt-BR"]);
  assert.ok(pedidos.every((p) => p.opcoes.signal instanceof AbortSignal), "cada pedido leva o sinal do timeout");
  assert.ok(pedidos.every((p) => p.de === null), "sem TRADUCAO_EMAIL, o parâmetro de não vai");
});

test("com TRADUCAO_EMAIL, o e-mail vai no parâmetro de", async () => {
  TRADUCAO.email = "projeto@exemplo.com";
  usarFetch((p) => traducaoOk(p.q, alvoDe(p)));

  await traduzir("Bom dia");

  assert.equal(pedidos.length, 4);
  assert.ok(pedidos.every((p) => p.de === "projeto@exemplo.com"));
});

test("texto maior que 500 bytes vai em pedaços de frases inteiras e volta junto, na ordem", async () => {
  const frase = (n) => `Frase número ${n} com acentuação, ç e ã para pesar mais bytes. `;
  const texto = Array.from({ length: 12 }, (_, i) => frase(i + 1)).join("").trim();
  assert.ok(Buffer.byteLength(texto) > LIMITE, "o texto do teste precisa passar do limite");

  const pedacos = dividir(texto);
  assert.ok(pedacos.length > 1);
  assert.equal(pedacos.join(""), texto, "juntos, os pedaços dão o texto de volta");
  for (const pedaco of pedacos) {
    assert.ok(Buffer.byteLength(pedaco) <= LIMITE, `pedaço com ${Buffer.byteLength(pedaco)} bytes`);
    assert.match(pedaco.trim(), /^Frase número \d+ .*bytes\.$/, "o corte cai entre frases");
  }

  usarFetch((p) => traducaoOk(p.q, alvoDe(p)));
  const resultado = await traduzir(texto);

  assert.equal(pedidos.length, pedacos.length * 4);
  assert.ok(pedidos.every((p) => Buffer.byteLength(p.q) <= LIMITE), "nenhum pedido passa de 500 bytes");
  assert.equal(resultado.en, pedacos.map((p) => `[en] ${p.trim()}`).join(" "));
  assert.equal(resultado.origem, texto);
});

test("frase sozinha maior que o limite quebra em palavras, sem perder nada", () => {
  const texto = "palavrão ".repeat(80).trim();
  const pedacos = dividir(texto);

  assert.ok(pedacos.length > 1);
  assert.equal(pedacos.join(""), texto);
  assert.ok(pedacos.every((p) => Buffer.byteLength(p) <= LIMITE));
  assert.ok(pedacos.every((p) => /^(palavrão ?)+$/.test(p)), "nenhuma palavra cortada no meio");
});

test("tradutor que não responde a tempo: devolve null, sem esperar além do timeout", async () => {
  TRADUCAO.esperaMs = 50;
  usarFetch(
    (p) =>
      new Promise((_, recusar) => {
        p.opcoes.signal.addEventListener("abort", () => recusar(p.opcoes.signal.reason));
      })
  );

  const inicio = Date.now();
  const resultado = await traduzir("Visto e residência");

  assert.equal(resultado, null);
  assert.ok(Date.now() - inicio < 1000, `levou ${Date.now() - inicio} ms`);
});

test("se um dos 4 idiomas falha, a tradução inteira vira null", async () => {
  usarFetch((p) => {
    if (alvoDe(p) === "fr") throw new TypeError("fetch failed");
    return traducaoOk(p.q, alvoDe(p));
  });

  assert.equal(await traduzir("Visto e residência"), null);
});

test("status diferente de 200, no HTTP ou no responseStatus, vira null", async () => {
  usarFetch(() => new Response("erro", { status: 500 }));
  assert.equal(await traduzir("Visto e residência"), null);

  usarFetch(() => respostaJson({ responseData: { translatedText: "QUERY LENGTH LIMIT EXCEEDED" }, responseStatus: "403" }));
  assert.equal(await traduzir("Visto e residência"), null);
});

test("quotaFinished vira null, mesmo com texto na resposta", async () => {
  usarFetch((p) => respostaJson({ responseData: { translatedText: "Visa and residence" }, quotaFinished: true, responseStatus: 200 }));

  assert.equal(await traduzir("Visto e residência"), null);
});

test("o aviso de cota no lugar da tradução (MYMEMORY WARNING) vira null", async () => {
  usarFetch(() =>
    respostaJson({ responseData: { translatedText: "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY" }, responseStatus: 200 })
  );

  assert.equal(await traduzir("Visto e residência"), null);
});

test("corpo vazio (o MyMemory sem cota responde assim) vira null", async () => {
  usarFetch(() => new Response("", { status: 200, headers: { "Retry-After": "75353" } }));

  assert.equal(await traduzir("Visto e residência"), null);
});

test("idioma detectado igual ao do alvo: fica o texto original", async () => {
  usarFetch((p) => traducaoOk(p.q, alvoDe(p), { detectedLanguage: "pt-BR" }));

  const resultado = await traduzir("Visto e residência");

  assert.equal(resultado.pt, "Visto e residência");
  assert.equal(resultado.en, "[en] Visto e residência");
});

test("o MyMemory recusando o mesmo idioma (PLEASE SELECT TWO DISTINCT LANGUAGES): fica o original", async () => {
  usarFetch((p) => {
    if (alvoDe(p) === "en") {
      return respostaJson({
        responseData: { translatedText: "PLEASE SELECT TWO DISTINCT LANGUAGES" },
        quotaFinished: null,
        responseDetails: "PLEASE SELECT TWO DISTINCT LANGUAGES",
        responseStatus: "403",
      });
    }
    return traducaoOk(p.q, alvoDe(p));
  });

  const resultado = await traduzir("Hello, I am a lawyer.");

  assert.equal(resultado.en, "Hello, I am a lawyer.");
  assert.equal(resultado.es, "[es] Hello, I am a lawyer.");
});

test("entidades HTML da resposta viram o caractere", async () => {
  usarFetch(() => respostaJson({ responseData: { translatedText: "L&#39;aide pour l&apos;adaptation &amp; &quot;plus&quot;" }, responseStatus: 200 }));

  const resultado = await traduzir("Apoio na adaptação");

  assert.equal(resultado.fr, `L'aide pour l'adaptation & "plus"`);
});

test("TRADUCAO_DESLIGADA: não chama o tradutor e devolve null", async () => {
  TRADUCAO.desligada = true;
  usarFetch((p) => traducaoOk(p.q, alvoDe(p)));

  assert.equal(await traduzir("Visto e residência"), null);
  assert.equal(pedidos.length, 0);
});

test("traduzirCampos: só o campo que mudou vai para o tradutor", async () => {
  usarFetch((p) => traducaoOk(p.q, alvoDe(p)));
  const atuais = {
    titulo: { origem: "Visto e residência", pt: "Visto e residência", en: "Visa", es: "Visado", fr: "Visa" },
    descricao: { origem: "Texto antigo", pt: "Texto antigo", en: "Old", es: "Viejo", fr: "Vieux" },
  };

  const mudancas = await traduzirCampos({ titulo: "Visto e residência", descricao: "Texto novo da descrição" }, atuais);

  assert.deepEqual(Object.keys(mudancas), ["descricao"]);
  assert.equal(mudancas.descricao.origem, "Texto novo da descrição");
  assert.ok(pedidos.every((p) => p.q === "Texto novo da descrição"), "o título, igual ao traduzido, não sai daqui");
});

test("traduzirCampos: campo que não veio fica de fora, campo apagado perde a tradução, falha vira null", async () => {
  usarFetch(() => {
    throw new TypeError("fetch failed");
  });

  assert.deepEqual(await traduzirCampos({ bio: undefined }, null), {});
  assert.deepEqual(await traduzirCampos({ bio: null }, { bio: { origem: "x" } }), { bio: null });
  assert.deepEqual(await traduzirCampos({ bio: "Advogado" }, null), { bio: null });
  assert.equal(pedidos.length, 4, "só o terceiro chamou o tradutor");
});

test("traduzirCampos: o mesmo texto sem tradução válida (falhou antes ou ficou velha) tenta de novo", async () => {
  usarFetch((p) => traducaoOk(p.q, alvoDe(p)));

  const mudancas = await traduzirCampos({ bio: "Advogado" }, { bio: { origem: "Advogada", en: "Lawyer" } });

  assert.equal(mudancas.bio.origem, "Advogado");
  assert.equal(pedidos.length, 4);
});
