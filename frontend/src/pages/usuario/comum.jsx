import { visualDaArea } from "../../dados/areas";

// data e hora de um horário da API viram um Date
export function momento(horario) {
  return new Date(`${horario.data}T${horario.hora_inicio}:00`);
}

export function EtiquetaArea({ nome }) {
  const { cor, fundo } = visualDaArea(nome);
  return (
    <span className="usu-area" style={{ background: fundo, color: cor }}>
      {nome}
    </span>
  );
}
