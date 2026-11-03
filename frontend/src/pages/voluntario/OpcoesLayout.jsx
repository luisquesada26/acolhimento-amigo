import { useState } from "react";
import "./opcoes-layout.css";

// só da fase de exemplos: troca entre as três opções de layout e lembra a escolha
const CHAVE = "acolhimento:opcao-layout-voluntario";

const OPCOES = [
  { id: "a", nome: "Clássica" },
  { id: "b", nome: "Ponta a ponta" },
  { id: "c", nome: "Flutuante" },
];

function lerOpcao() {
  try {
    const salva = localStorage.getItem(CHAVE);
    return OPCOES.some((o) => o.id === salva) ? salva : "a";
  } catch {
    return "a";
  }
}

export function useOpcaoLayout() {
  const [opcao, setOpcao] = useState(lerOpcao);

  function escolher(id) {
    setOpcao(id);
    try {
      localStorage.setItem(CHAVE, id);
    } catch {
      // sem localStorage só não lembra a escolha
    }
  }

  return [opcao, escolher];
}

export function BarraOpcoes({ opcao, aoMudar }) {
  return (
    <div className="opcoes-layout" role="group" aria-label="Opções de layout">
      <span>Layout</span>
      {OPCOES.map((o) => (
        <button key={o.id} type="button" aria-pressed={opcao === o.id} onClick={() => aoMudar(o.id)}>
          <strong>{o.id.toUpperCase()}</strong> {o.nome}
        </button>
      ))}
    </div>
  );
}
