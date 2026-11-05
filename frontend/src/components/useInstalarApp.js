import { useState, useSyncExternalStore } from "react";

const CHAVE_FECHADO = "acolhimento:instalar-fechado";

// O Chrome do Android avisa que dá para instalar com o beforeinstallprompt, uma vez só e às vezes antes
// do React montar. Por isso o ouvinte fica aqui no módulo, que carrega junto com o site (as áreas são
// importadas direto no App), e o evento fica guardado até alguém tocar em "Instalar app"
let pedido = null;
let instalado = false;
let fechado = false;
const ouvintes = new Set();

function avisar() {
  for (const ouvinte of ouvintes) ouvinte();
}

function lerFechado() {
  try {
    return localStorage.getItem(CHAVE_FECHADO) === "sim";
  } catch {
    return false;
  }
}

// aberto pelo ícone: no Android vira display-mode standalone; no iPhone, navigator.standalone
function abertoComoApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

// iPhone e iPad não têm o evento: lá se instala pelo Compartilhar. O iPad novo se diz Macintosh, mas tem toque
function ehIphoneOuIpad() {
  const agente = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(agente) || (/Macintosh/.test(agente) && navigator.maxTouchPoints > 1);
}

if (typeof window !== "undefined") {
  instalado = abertoComoApp();
  fechado = lerFechado();
  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    pedido = evento;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    pedido = null;
    instalado = true;
    avisar();
  });
}

function assinar(ouvinte) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

// "android": dá para chamar o prompt(); "iphone": mostra os passos; "nada": não oferece.
// Só em tela de toque (celular e tablet) e nunca dentro do app já instalado
function lerJeito() {
  if (instalado || !window.matchMedia("(pointer: coarse)").matches) return "nada";
  if (pedido) return "android";
  return ehIphoneOuIpad() ? "iphone" : "nada";
}

const lerFechadoAtual = () => fechado;

export function useInstalarApp() {
  const jeito = useSyncExternalStore(assinar, lerJeito, () => "nada");
  const faixaFechada = useSyncExternalStore(assinar, lerFechadoAtual, () => true);
  const [passosAbertos, setPassosAbertos] = useState(false);

  async function instalar() {
    if (jeito === "iphone") {
      setPassosAbertos(true);
      return;
    }
    if (!pedido) return;
    // o evento só serve uma vez; aceitou, o convite some de todo lugar.
    // Recusou: some até o Chrome avisar de novo, numa próxima visita
    const evento = pedido;
    pedido = null;
    try {
      await evento.prompt();
      const { outcome } = await evento.userChoice;
      if (outcome === "accepted") instalado = true;
    } finally {
      avisar();
    }
  }

  function fecharFaixa() {
    fechado = true;
    try {
      localStorage.setItem(CHAVE_FECHADO, "sim");
    } catch {
      // sem localStorage a faixa só volta na próxima visita
    }
    avisar();
  }

  return {
    disponivel: jeito !== "nada",
    faixaFechada,
    instalar,
    fecharFaixa,
    passosAbertos,
    fecharPassos: () => setPassosAbertos(false),
  };
}
