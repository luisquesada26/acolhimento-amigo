import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api, { lerErro } from "../../services/api";

const IDIOMAS = { pt: "Português", en: "Inglês", es: "Espanhol", fr: "Francês" };

export function nomeDoIdioma(codigo) {
  return IDIOMAS[codigo] ?? codigo;
}

// a agenda vem como data e hora separadas; junta para comparar com agora
function momento(data, hora) {
  return new Date(`${data}T${hora}:00`);
}

export default function usePainel() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const [dados, setDados] = useState({ carregando: true, erro: "", perfil: null, agendamentos: [], horarios: [], servicos: [], areas: [] });

  const carregar = useCallback(async () => {
    try {
      const [perfil, agendamentos, horarios, servicos, areas] = await Promise.all([
        api.get("/me"),
        api.get("/meus-agendamentos"),
        api.get("/meus-horarios"),
        api.get("/meus-servicos"),
        api.get("/areas"),
      ]);
      setDados({
        carregando: false,
        erro: "",
        perfil: perfil.data,
        agendamentos: agendamentos.data,
        horarios: horarios.data,
        servicos: servicos.data,
        areas: areas.data,
      });
    } catch (erro) {
      setDados((atual) => ({ ...atual, carregando: false, erro: lerErro(erro).mensagem }));
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const agora = new Date();

  const agendamentos = dados.agendamentos.map((a) => ({
    ...a,
    inicio: momento(a.horario.data, a.horario.hora_inicio),
    fim: momento(a.horario.data, a.horario.hora_fim),
  }));

  const confirmados = agendamentos.filter((a) => a.status === "confirmado");
  const futuros = confirmados.filter((a) => a.fim > agora).sort((a, b) => a.inicio - b.inicio);
  // já terminou mas ainda está confirmado: falta o voluntário dizer se aconteceu
  const aguardando = confirmados.filter((a) => a.fim <= agora).sort((a, b) => a.inicio - b.inicio);
  const passados = agendamentos.filter((a) => a.status !== "confirmado").sort((a, b) => b.inicio - a.inicio);
  const realizados = passados.filter((a) => a.status === "realizado");
  const horariosLivres = dados.horarios
    .filter((h) => h.status === "livre" && momento(h.data, h.hora_inicio) > agora)
    .sort((a, b) => momento(a.data, a.hora_inicio) - momento(b.data, b.hora_inicio));

  // números de um mês ("2026-10") ou de todo o período (vazio)
  function numerosDoPeriodo(mes) {
    const noPeriodo = (data) => !mes || data.startsWith(mes);
    const realizadosNoPeriodo = realizados.filter((a) => noPeriodo(a.horario.data));
    return {
      realizados: realizadosNoPeriodo.length,
      pessoas: new Set(realizadosNoPeriodo.map((a) => a.usuario.id)).size,
      minutos: realizadosNoPeriodo.reduce((total, a) => total + (a.fim - a.inicio) / 60000, 0),
      marcados: futuros.filter((a) => noPeriodo(a.horario.data)).length,
      livres: horariosLivres.filter((h) => noPeriodo(h.data)).length,
    };
  }

  // meses que têm atendimento ou horário livre, do mais recente para o mais antigo
  const meses = [...new Set([...agendamentos.map((a) => a.horario.data.slice(0, 7)), ...horariosLivres.map((h) => h.data.slice(0, 7))])]
    .sort()
    .reverse();

  const voluntario = dados.perfil?.voluntario;
  const pendencias = [
    { chave: "perfil", titulo: "Idiomas e apresentação", feito: Boolean(voluntario?.idiomas?.length && voluntario?.bio) },
    { chave: "servico", titulo: "Pelo menos um serviço ativo", feito: dados.servicos.some((s) => s.ativo) },
    { chave: "horario", titulo: "Horários livres na agenda", feito: horariosLivres.length > 0 },
  ];

  // as ações devolvem a mensagem de erro da API, para a tela mostrar
  async function executar(acao) {
    try {
      await acao();
      await carregar();
      return null;
    } catch (erro) {
      return lerErro(erro).mensagem;
    }
  }

  return {
    ...dados,
    usuario,
    area: dados.areas.find((a) => a.id === voluntario?.area_id)?.nome ?? "",
    proximo: futuros[0] ?? null,
    futuros,
    aguardando,
    passados,
    horariosLivres,
    todos: [...futuros, ...aguardando, ...passados],
    meses,
    numerosDoPeriodo,
    pendencias,
    perfilCompleto: pendencias.every((p) => p.feito),
    // concluir já leva a anotação, se o voluntário escreveu
    marcarRealizado: (id, anotacao = "") =>
      executar(() => api.put(`/agendamentos/${id}`, { status: "realizado", ...(anotacao.trim() ? { anotacao: anotacao.trim() } : {}) })),
    salvarAnotacao: (id, anotacao) => executar(() => api.put(`/agendamentos/${id}`, { anotacao: anotacao.trim() })),
    cancelar: (id) => executar(() => api.delete(`/agendamentos/${id}`)),
    criarHorario: (horario) => executar(() => api.post("/horarios", horario)),
    // abre vários horários e recarrega uma vez só no fim; os que batem com outro voltam como erro
    criarHorarios: async (lista) => {
      let criados = 0;
      const erros = [];
      for (const horario of lista) {
        try {
          await api.post("/horarios", horario);
          criados++;
        } catch (erro) {
          erros.push(lerErro(erro).mensagem);
        }
      }
      await carregar();
      return { criados, erros };
    },
    // horário reservado só sai com confirmar=true, porque cancela o atendimento junto
    excluirHorario: (id, reservado) => executar(() => api.delete(`/horarios/${id}${reservado ? "?confirmar=true" : ""}`)),
    criarServico: (servico) => executar(() => api.post("/servicos", servico)),
    editarServico: (id, campos) => executar(() => api.put(`/servicos/${id}`, campos)),
    // serviço que já teve atendimento não é apagado: a API só desativa e responde 200
    excluirServico: async (id) => {
      try {
        const { status } = await api.delete(`/servicos/${id}`);
        await carregar();
        return { erro: null, desativado: status === 200 };
      } catch (erro) {
        return { erro: lerErro(erro).mensagem, desativado: false };
      }
    },
    salvarPerfil: (campos) => executar(() => api.put("/me", campos)),
    excluirConta: async () => {
      try {
        await api.delete("/me");
        sair();
        navigate("/login");
        return null;
      } catch (erro) {
        return lerErro(erro).mensagem;
      }
    },
    recarregar: carregar,
    sair: () => {
      sair();
      navigate("/login");
    },
  };
}
