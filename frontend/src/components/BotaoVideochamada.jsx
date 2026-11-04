import { useEffect, useId, useState } from "react";
import api, { lerErroSemTraduzir } from "../services/api";
import { traduzirErroApi } from "../services/errosApi";
import { useTextos } from "../context/IdiomaContext";
import "./videochamada.css";

const TEXTOS = {
  pt: { entrar: "Entrar na videochamada", abrindo: "Abrindo a sala...", liberaAs: (hora) => `Libera às ${hora}`, liberaAntes: "Libera 10 min antes" },
  en: { entrar: "Join video call", abrindo: "Opening the room...", liberaAs: (hora) => `Opens at ${hora}`, liberaAntes: "Opens 10 min before the start" },
  es: { entrar: "Unirse a la videollamada", abrindo: "Abriendo la sala...", liberaAs: (hora) => `Se habilita a las ${hora}`, liberaAntes: "Se habilita 10 min antes del inicio" },
  fr: { entrar: "Rejoindre l’appel vidéo", abrindo: "Ouverture de la salle...", liberaAs: (hora) => `Disponible à partir de ${hora}`, liberaAntes: "Disponible 10 min avant le début" },
};

// o botão libera 10 minutos antes do horário e some quando o atendimento acaba
const ANTES = 10 * 60 * 1000;

function IconeVideo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 7l-7 5 7 5z M1 5h15v14H1z" />
    </svg>
  );
}

// o relógio anda sozinho, para o botão liberar na hora sem recarregar a página
function useAgora() {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const relogio = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(relogio);
  }, []);
  return agora;
}

export default function BotaoVideochamada({ atendimento, className = "", aoAtualizar }) {
  const t = useTextos(TEXTOS);
  const agora = useAgora();
  const idDica = useId();
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState("");

  const { data, hora_inicio, hora_fim } = atendimento.horario;
  const inicio = new Date(`${data}T${hora_inicio}:00`);
  const fim = new Date(`${data}T${hora_fim}:00`);
  if (atendimento.status !== "confirmado" || agora > fim) return null;

  const classe = `videochamada ${className}`.trim();
  const liberaEm = new Date(inicio.getTime() - ANTES);

  if (agora < liberaEm) {
    const hoje = liberaEm.toDateString() === agora.toDateString();
    return (
      <span className="videochamada-caixa">
        <button type="button" className={classe} disabled aria-describedby={idDica}>
          <IconeVideo /> {t.entrar}
        </button>
        <small id={idDica} className="videochamada-dica">
          {hoje ? t.liberaAs(liberaEm.toTimeString().slice(0, 5)) : t.liberaAntes}
        </small>
      </span>
    );
  }

  if (atendimento.link_video) {
    return (
      <a className={classe} href={atendimento.link_video} target="_blank" rel="noopener noreferrer">
        <IconeVideo /> {t.entrar}
      </a>
    );
  }

  // sem sala ainda (os do seed, ou o Google falhou ao marcar): a API cria na hora
  async function abrirSala() {
    // a aba abre já no clique, senão o navegador bloqueia; o endereço chega depois
    const aba = window.open("", "_blank");
    setAbrindo(true);
    setErro("");
    try {
      const { data: atualizado } = await api.post(`/agendamentos/${atendimento.id}/videochamada`);
      if (aba) {
        aba.opener = null;
        aba.location.href = atualizado.link_video;
      }
      aoAtualizar?.(atualizado);
    } catch (problema) {
      aba?.close();
      setErro(lerErroSemTraduzir(problema).mensagem);
    } finally {
      setAbrindo(false);
    }
  }

  return (
    <span className="videochamada-caixa">
      <button type="button" className={classe} onClick={abrirSala} disabled={abrindo}>
        <IconeVideo /> {abrindo ? t.abrindo : t.entrar}
      </button>
      {erro && (
        <small className="videochamada-erro" role="alert">
          {traduzirErroApi(erro)}
        </small>
      )}
    </span>
  );
}
