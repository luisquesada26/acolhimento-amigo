import { useEffect, useRef, useState } from "react";
import { useIdioma } from "../context/IdiomaContext";
import { nomeDaArea, visualDaArea } from "../dados/areas";

function IconeArea({ nome }) {
  const { cor, fundo, icone } = visualDaArea(nome);
  return (
    <span className="icone-area" style={{ background: fundo, color: cor }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={icone} />
      </svg>
    </span>
  );
}

// lista de áreas no lugar do select nativo, com ícone e cor e funcionando pelo teclado
export default function SeletorArea({ id, rotulo, textoVazio = "Escolha sua área", areas, valor, aoEscolher, erro }) {
  const { idioma } = useIdioma();
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const caixa = useRef(null);
  const botao = useRef(null);
  const lista = useRef(null);

  const escolhida = areas.find((a) => String(a.id) === String(valor));

  useEffect(() => {
    if (!aberto) return;
    function cliqueFora(evento) {
      if (!caixa.current.contains(evento.target)) setAberto(false);
    }
    document.addEventListener("mousedown", cliqueFora);
    return () => document.removeEventListener("mousedown", cliqueFora);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    lista.current?.focus();
    lista.current?.querySelector(`[data-indice="${ativo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [aberto, ativo]);

  function abrir() {
    const atual = areas.findIndex((a) => String(a.id) === String(valor));
    setAtivo(atual >= 0 ? atual : 0);
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
    botao.current?.focus();
  }

  function escolher(area) {
    aoEscolher(String(area.id));
    fechar();
  }

  function teclaNoBotao(evento) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(evento.key)) {
      evento.preventDefault();
      abrir();
    }
  }

  function teclaNaLista(evento) {
    const ultimo = areas.length - 1;
    const acoes = {
      ArrowDown: () => setAtivo((i) => Math.min(i + 1, ultimo)),
      ArrowUp: () => setAtivo((i) => Math.max(i - 1, 0)),
      Home: () => setAtivo(0),
      End: () => setAtivo(ultimo),
      Enter: () => escolher(areas[ativo]),
      " ": () => escolher(areas[ativo]),
      Escape: () => fechar(),
    };

    if (evento.key === "Tab") {
      setAberto(false);
      return;
    }
    if (acoes[evento.key]) {
      evento.preventDefault();
      acoes[evento.key]();
    }
  }

  return (
    <div className="campo seletor" ref={caixa}>
      <label id={`${id}-rotulo`} htmlFor={id}>
        {rotulo}
      </label>
      <button
        id={id}
        ref={botao}
        type="button"
        className="seletor-botao"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={`${id}-lista`}
        aria-invalid={Boolean(erro)}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={teclaNoBotao}
      >
        {escolhida ? (
          <>
            <IconeArea nome={escolhida.nome} />
            <span className="seletor-texto">{nomeDaArea(escolhida.nome, idioma)}</span>
          </>
        ) : (
          <span className="seletor-texto seletor-vazio">{textoVazio}</span>
        )}
        <svg className="seletor-seta" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <ul
          id={`${id}-lista`}
          ref={lista}
          className="seletor-lista"
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-rotulo`}
          aria-activedescendant={`${id}-opcao-${ativo}`}
          onKeyDown={teclaNaLista}
        >
          {areas.map((area, indice) => {
            const selecionada = String(area.id) === String(valor);
            return (
              <li
                key={area.id}
                id={`${id}-opcao-${indice}`}
                data-indice={indice}
                role="option"
                aria-selected={selecionada}
                className={indice === ativo ? "ativa" : undefined}
                onMouseEnter={() => setAtivo(indice)}
                onClick={() => escolher(area)}
              >
                <IconeArea nome={area.nome} />
                <span className="seletor-texto">{nomeDaArea(area.nome, idioma)}</span>
                {selecionada && (
                  <svg className="seletor-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {erro && <span className="campo-erro">{erro}</span>}
    </div>
  );
}
