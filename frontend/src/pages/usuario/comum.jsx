import { useEffect, useState } from "react";
import api from "../../services/api";
import { visualDaArea } from "../../dados/areas";

// data e hora de um horário da API viram um Date
export function momento(horario) {
  return new Date(`${horario.data}T${horario.hora_inicio}:00`);
}

export function IconeArea({ nome, tamanho = 20 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={visualDaArea(nome).icone} />
    </svg>
  );
}

// todos os voluntários, sem filtro, para os números do topo e a contagem por área
export function useTodos() {
  const [todos, setTodos] = useState([]);
  useEffect(() => {
    api
      .get("/voluntarios")
      .then((resposta) => setTodos(resposta.data))
      .catch(() => setTodos([]));
  }, []);
  return todos;
}

export function totalPorArea(todos) {
  const total = new Map();
  for (const v of todos) total.set(v.area_id, (total.get(v.area_id) ?? 0) + 1);
  return total;
}

export function Esqueleto({ className }) {
  return <span className={`bus-esqueleto ${className ?? ""}`} aria-hidden="true" />;
}

export function EtiquetaArea({ nome }) {
  const { cor, fundo } = visualDaArea(nome);
  return (
    <span className="usu-area" style={{ background: fundo, color: cor }}>
      {nome}
    </span>
  );
}
