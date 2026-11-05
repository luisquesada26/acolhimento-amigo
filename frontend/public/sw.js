// Service worker do Acolhimento Amigo: o site abre sem internet, mas os dados da API nunca ficam guardados.
// O build (vite.config.js) preenche a versão do cache e a lista de arquivos com os do próprio build;
// como o arquivo muda a cada deploy, o navegador instala a versão nova sozinho.
const CACHE = "acolhimento-__VERSAO__";
const PAGINA = "/";

// o JS, o CSS e as imagens deste build (nome com hash: nunca mudam)
const ARQUIVOS_DO_BUILD = ["__ARQUIVOS__"];
// arquivos de public/ que as telas usam; sem hash no nome, então vão pela rede primeiro
const ARQUIVOS_FIXOS = ["/favicon.svg", "/images/logo.svg", "/images/logo-branco.svg"];

const FONTES = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
const SERVIDORES_DE_FONTE = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

// na instalação já guarda tudo o que a página precisa para abrir sem internet
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll([PAGINA, ...ARQUIVOS_FIXOS, ...ARQUIVOS_DO_BUILD]);
      await guardarFontes(cache);
      await self.skipWaiting();
    })(),
  );
});

// as fontes são um extra: se o Google não responder, o service worker instala igual
async function guardarFontes(cache) {
  try {
    const css = await fetch(FONTES);
    if (!css.ok) return;
    const texto = await css.clone().text();
    await cache.put(FONTES, css);
    const arquivos = [...texto.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((achado) => achado[1]);
    await cache.addAll([...new Set(arquivos)]);
  } catch {
    // sem as fontes guardadas, sem internet a página usa a fonte do sistema
  }
}

// a versão nova apaga os caches das anteriores e passa a cuidar das abas já abertas
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(nomes.filter((nome) => nome.startsWith("acolhimento-") && nome !== CACHE).map((nome) => caches.delete(nome)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  // só GET; a API passa direto, para os dados do atendimento virem sempre da hora
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.pathname.startsWith("/api/")) return;

  const daqui = url.origin === self.location.origin;
  if (daqui && pedido.mode === "navigate") {
    evento.respondWith(abrirPagina(pedido));
  } else if ((daqui && url.pathname.startsWith("/assets/")) || SERVIDORES_DE_FONTE.includes(url.origin)) {
    evento.respondWith(guardadoPrimeiro(pedido));
  } else if (daqui && ARQUIVOS_FIXOS.includes(url.pathname)) {
    evento.respondWith(redePrimeiro(pedido));
  }
  // o resto (API em outro endereço, fotos, videochamada) segue direto para a rede
});

// navegação: rede primeiro; sem internet abre a página guardada e o React Router acha a rota
async function abrirPagina(pedido) {
  try {
    return await fetch(pedido);
  } catch {
    const cache = await caches.open(CACHE);
    return (await cache.match(PAGINA, { ignoreVary: true })) ?? Response.error();
  }
}

// arquivo com hash e fonte: o guardado vale; o que faltar vem da rede e fica guardado
async function guardadoPrimeiro(pedido) {
  const cache = await caches.open(CACHE);
  const guardado = await cache.match(pedido, { ignoreVary: true });
  if (guardado) return guardado;
  const resposta = await fetch(pedido);
  if (resposta.ok || resposta.type === "opaque") await cache.put(pedido, resposta.clone());
  return resposta;
}

// logo e ícone sem hash: a rede traz a versão atual; sem internet fica a guardada
async function redePrimeiro(pedido) {
  const cache = await caches.open(CACHE);
  try {
    const resposta = await fetch(pedido);
    if (resposta.ok) await cache.put(pedido, resposta.clone());
    return resposta;
  } catch {
    return (await cache.match(pedido, { ignoreVary: true })) ?? Response.error();
  }
}
