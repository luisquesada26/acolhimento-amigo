import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { LANG, useIdioma } from "../context/IdiomaContext";
import { codigoDoPais, nomeDoPais, normalizar } from "../dados/paises";
import "./campo-pais.css";

// bandeira em SVG porque o Windows não desenha emoji de bandeira; cada arquivo só baixa quando aparece na tela,
// o JS leva só o endereço. Ficam de fora União Europeia, pseudo-regiões, Antártida e ilhas desabitadas
const ARQUIVOS = import.meta.glob(["../../node_modules/country-flag-icons/3x2/??.svg", "!../../node_modules/country-flag-icons/3x2/{EU,XA,XC,XO,AQ,BV,HM,UM}.svg"], {
  eager: true,
  query: "?no-inline",
  import: "default",
});

const IDIOMAS = Object.keys(LANG);

// ".../3x2/BR.svg" -> "BR"
const BANDEIRAS = Object.fromEntries(Object.entries(ARQUIVOS).map(([arquivo, url]) => [arquivo.slice(-6, -4), url]));

// cada país com o nome nos 4 idiomas, montado uma vez só, na primeira busca
let paises = null;

function todosOsPaises() {
  if (!paises) {
    const regioes = IDIOMAS.map((i) => new Intl.DisplayNames([LANG[i]], { type: "region", fallback: "none" }));
    paises = [];
    for (const codigo of Object.keys(BANDEIRAS)) {
      const nomes = Object.fromEntries(IDIOMAS.map((i, n) => [i, regioes[n].of(codigo)]));
      if (IDIOMAS.some((i) => !nomes[i])) continue;
      const chaves = Object.fromEntries(IDIOMAS.map((i) => [i, normalizar(nomes[i])]));
      const palavras = IDIOMAS.flatMap((i) => nomes[i].split(/[^\p{L}\p{N}]+/u).map(normalizar)).filter(Boolean);
      paises.push({ codigo, nomes, chaves, palavras });
    }
  }
  return paises;
}

// 0: o nome no idioma da tela começa com o que foi digitado; 1: o nome em outro idioma começa;
// 2: alguma palavra do nome começa; 3: aparece no meio
function notaDe(pais, busca, idioma) {
  if (pais.chaves[idioma].startsWith(busca)) return 0;
  if (IDIOMAS.some((i) => pais.chaves[i].startsWith(busca))) return 1;
  if (pais.palavras.some((p) => p.startsWith(busca))) return 2;
  if (IDIOMAS.some((i) => pais.chaves[i].includes(busca))) return 3;
  return -1;
}

const ordens = {};

function buscar(texto, idioma) {
  const busca = normalizar(texto);
  const achados = [];
  for (const pais of todosOsPaises()) {
    const nota = busca ? notaDe(pais, busca, idioma) : 0;
    if (nota < 0) continue;
    // achou pelo nome em outro idioma ("Germany" com a tela em português): mostra esse nome embaixo
    const outro = busca && !pais.chaves[idioma].includes(busca) ? IDIOMAS.find((i) => pais.chaves[i].includes(busca)) : undefined;
    achados.push({ pais, nota, outro });
  }
  ordens[idioma] ??= new Intl.Collator(LANG[idioma]);
  return achados.sort((a, b) => a.nota - b.nota || ordens[idioma].compare(a.pais.nomes[idioma], b.pais.nomes[idioma]));
}

// limite de cima e de baixo do que fica visível: a tela e todo pai que corta o que passa dele
function espacoEmVolta(elemento) {
  const tela = window.visualViewport;
  let cima = tela ? tela.offsetTop : 0;
  let baixo = tela ? tela.offsetTop + tela.height : window.innerHeight;
  for (let pai = elemento.parentElement; pai && pai !== document.body; pai = pai.parentElement) {
    if (getComputedStyle(pai).overflowY === "visible") continue;
    const caixa = pai.getBoundingClientRect();
    cima = Math.max(cima, caixa.top);
    baixo = Math.min(baixo, caixa.bottom);
  }
  const caixa = elemento.getBoundingClientRect();
  return { acima: caixa.top - cima - 12, abaixo: baixo - caixa.bottom - 12 };
}

export function BandeiraDoPais({ pais }) {
  const url = BANDEIRAS[codigoDoPais(pais)];
  return url ? <img className="cpais-bandeira" src={url} alt="" width="24" height="16" decoding="async" /> : null;
}

// o banco guarda o nome do país (como paises.js entende); só dá para escolher país da lista,
// e um valor antigo que não seja país aparece como está até a pessoa escolher outro
export default function CampoPais({ id, valor, aoMudar, rotuloId, descricaoId, invalido = false, placeholder, textos, classeEntrada = "" }) {
  const { idioma } = useIdioma();
  const entrada = useRef(null);
  const lista = useRef(null);
  // o que a pessoa está digitando; null mostra o país escolhido
  const [texto, setTexto] = useState(null);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(null);
  const [painel, setPainel] = useState({ acima: false, altura: 320 });

  const codigo = codigoDoPais(valor);
  const escolhido = codigo ? nomeDoPais(valor) : (valor ?? "");
  const resultados = useMemo(() => (aberto ? buscar(texto ?? "", idioma) : []), [aberto, texto, idioma]);
  const listaId = `${id}-lista`;
  const idDaOpcao = (c) => `${id}-opcao-${c}`;

  // digitando, o primeiro resultado já fica marcado para o Enter
  let indiceAtivo = resultados.findIndex((r) => r.pais.codigo === ativo);
  if (indiceAtivo < 0 && texto?.trim() && resultados.length) indiceAtivo = 0;

  useLayoutEffect(() => {
    if (!aberto) return;
    function medir() {
      const { acima, abaixo } = espacoEmVolta(entrada.current);
      const paraCima = abaixo < 220 && acima > abaixo;
      setPainel({ acima: paraCima, altura: Math.max(140, Math.min(320, paraCima ? acima : abaixo)) });
    }
    medir();
    window.addEventListener("resize", medir);
    window.visualViewport?.addEventListener("resize", medir);
    return () => {
      window.removeEventListener("resize", medir);
      window.visualViewport?.removeEventListener("resize", medir);
    };
  }, [aberto]);

  // a opção marcada pelo teclado fica sempre à vista dentro da lista
  useLayoutEffect(() => {
    const ul = lista.current;
    const li = indiceAtivo >= 0 ? ul?.children[indiceAtivo] : null;
    if (!li) return;
    if (li.offsetTop < ul.scrollTop) ul.scrollTop = li.offsetTop - 6;
    else if (li.offsetTop + li.offsetHeight > ul.scrollTop + ul.clientHeight) ul.scrollTop = li.offsetTop + li.offsetHeight - ul.clientHeight + 6;
  }, [indiceAtivo, resultados, painel]);

  function abrir(marcado = codigo ?? null) {
    setAtivo(marcado);
    setAberto(true);
  }

  function fechar() {
    setTexto(null);
    setAberto(false);
    setAtivo(null);
  }

  function escolher(pais) {
    aoMudar(pais.nomes[idioma]);
    fechar();
  }

  // saindo do campo: o nome digitado inteiro vale como escolha; apagado limpa; o resto volta ao que estava
  function sair() {
    if (texto !== null) {
      const digitado = texto.trim();
      if (!digitado) aoMudar("");
      else if (BANDEIRAS[codigoDoPais(digitado)]) aoMudar(nomeDoPais(digitado));
    }
    fechar();
  }

  // a seta com a lista fechada abre já marcando o país escolhido, ou o primeiro (o último, para cima)
  function mover(passo) {
    if (!aberto) return abrir(codigo ?? buscar(texto ?? "", idioma).at(passo > 0 ? 0 : -1)?.pais.codigo ?? null);
    if (!resultados.length) return;
    const ultimo = resultados.length - 1;
    const proximo = indiceAtivo < 0 ? (passo > 0 ? 0 : ultimo) : Math.min(Math.max(indiceAtivo + passo, 0), ultimo);
    setAtivo(resultados[proximo].pais.codigo);
  }

  function tecla(evento) {
    const passos = { ArrowDown: 1, ArrowUp: -1, PageDown: 8, PageUp: -8 };
    if (passos[evento.key] && (aberto || evento.key.startsWith("Arrow"))) {
      evento.preventDefault();
      mover(passos[evento.key]);
    } else if (evento.key === "Enter" && aberto) {
      evento.preventDefault();
      if (indiceAtivo >= 0) escolher(resultados[indiceAtivo].pais);
      else fechar();
    } else if (evento.key === "Escape" && (aberto || texto !== null)) {
      evento.preventDefault();
      fechar();
    }
  }

  const mostrarBandeira = texto === null && BANDEIRAS[codigo];

  // entrando no campo ou abrindo a lista, o texto fica selecionado: escrever já troca o país inteiro
  return (
    <div className={painel.acima ? "cpais cpais-acima" : "cpais"}>
      <span className="cpais-icone" aria-hidden="true">
        {mostrarBandeira ? <BandeiraDoPais pais={valor} /> : <Search size={18} />}
      </span>
      <input
        ref={entrada}
        id={id}
        className={`cpais-entrada ${classeEntrada}`.trim()}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-activedescendant={indiceAtivo >= 0 ? idDaOpcao(resultados[indiceAtivo].pais.codigo) : undefined}
        aria-labelledby={rotuloId}
        aria-describedby={descricaoId}
        aria-invalid={invalido}
        autoComplete="off"
        spellCheck={false}
        maxLength={60}
        placeholder={placeholder}
        value={texto ?? escolhido}
        onChange={(e) => {
          setTexto(e.target.value);
          setAtivo(null);
          setAberto(true);
        }}
        onKeyDown={tecla}
        onFocus={(e) => e.target.select()}
        onClick={(e) => {
          if (aberto) return;
          // clicando em cima do texto já selecionado, o Chrome põe o cursor no lugar do clique e o select() sozinho
          // não percebe a mudança; desfazer antes faz a seleção valer
          e.currentTarget.setSelectionRange(0, 0);
          e.currentTarget.select();
          abrir();
        }}
        onBlur={sair}
      />
      <button
        type="button"
        className="cpais-abrir"
        tabIndex={-1}
        aria-label={textos.mostrar}
        aria-expanded={aberto}
        aria-controls={listaId}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          if (aberto) return fechar();
          entrada.current.focus();
          abrir();
        }}
      >
        <ChevronDown size={20} />
      </button>
      <ul
        ref={lista}
        id={listaId}
        className="cpais-lista"
        role="listbox"
        aria-labelledby={rotuloId}
        style={{ maxHeight: painel.altura }}
        hidden={!resultados.length}
        onMouseDown={(e) => e.preventDefault()}
      >
        {resultados.map(({ pais, outro }, i) => (
          <li
            key={pais.codigo}
            id={idDaOpcao(pais.codigo)}
            role="option"
            aria-selected={i === indiceAtivo}
            className={pais.codigo === codigo ? "cpais-opcao cpais-opcao-escolhida" : "cpais-opcao"}
            onClick={() => escolher(pais)}
          >
            <img className="cpais-bandeira" src={BANDEIRAS[pais.codigo]} alt="" width="24" height="16" loading="lazy" decoding="async" />
            <span className="cpais-nome">
              {pais.nomes[idioma]}
              {outro && <small lang={LANG[outro]}>{pais.nomes[outro]}</small>}
            </span>
            {pais.codigo === codigo && <Check className="cpais-check" size={18} aria-hidden="true" />}
          </li>
        ))}
      </ul>
      <div className="cpais-vazio" role="status">
        {aberto && !resultados.length ? textos.nenhum : ""}
      </div>
    </div>
  );
}
