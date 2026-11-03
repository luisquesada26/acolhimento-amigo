import { useCallback, useEffect, useRef, useState } from "react";
import api, { lerErro } from "../../services/api";

const ESPERA_DIGITANDO = 350;

// quando: "" (qualquer dia), "semana" (próximos 7 dias) ou um dia AAAA-MM-DD
const FILTROS_VAZIOS = { q: "", area: "", idioma: "", turno: "", quando: "" };

const doisDigitos = (n) => String(n).padStart(2, "0");

// AAAA-MM-DD pela data local: toISOString() usa UTC e, às 22h no Brasil, já devolve o dia seguinte
function dataLocal(dia) {
  return `${dia.getFullYear()}-${doisDigitos(dia.getMonth() + 1)}-${doisDigitos(dia.getDate())}`;
}

// o caminho de volta: new Date("2026-11-06") seria meia-noite UTC, ainda dia 5 no Brasil
export function lerDataLocal(valor) {
  const [ano, mes, dia] = valor.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

// a grade do "Escolher dia": semanas de segunda a domingo, da semana de hoje até cobrir os próximos 14 dias.
// Os dias antes de hoje e depois do 14º só completam a semana e vêm com livre: false
export function diasDoCalendario(agora = new Date(), quantos = 14) {
  // getDay() conta a partir do domingo; aqui a segunda é a coluna 0
  const recuo = (agora.getDay() + 6) % 7;
  const semanas = Math.ceil((recuo + quantos) / 7);
  return Array.from({ length: semanas * 7 }, (_, i) => {
    const data = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - recuo + i);
    const distancia = i - recuo;
    return { valor: dataLocal(data), data, hoje: distancia === 0, livre: distancia >= 0 && distancia < quantos };
  });
}

// na tela o "Quando" é um campo só; para a API vira disponivel=semana ou data=AAAA-MM-DD
function paraParametros({ quando, ...resto }) {
  const params = Object.fromEntries(Object.entries(resto).filter(([, valor]) => valor !== ""));
  if (quando === "semana") params.disponivel = "semana";
  else if (quando) params.data = quando;
  return params;
}

// a busca é feita pela API: cada filtro vira parâmetro de GET /voluntarios
export default function useBusca() {
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [areas, setAreas] = useState([]);
  const [voluntarios, setVoluntarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // ignora a resposta de uma busca que já foi substituída por outra
  const pedido = useRef(0);

  useEffect(() => {
    api
      .get("/areas")
      .then((resposta) => setAreas(resposta.data))
      .catch(() => setAreas([]));
  }, []);

  const buscar = useCallback(async (atuais) => {
    const meu = ++pedido.current;
    setCarregando(true);
    try {
      const { data } = await api.get("/voluntarios", { params: paraParametros(atuais) });
      if (meu !== pedido.current) return;
      setVoluntarios(data);
      setErro("");
    } catch (problema) {
      if (meu !== pedido.current) return;
      setErro(lerErro(problema).mensagem);
      setVoluntarios([]);
    } finally {
      if (meu === pedido.current) setCarregando(false);
    }
  }, []);

  // só o texto espera a pessoa parar de digitar; os seletores buscam na hora
  useEffect(() => {
    if (!filtros.q) {
      buscar(filtros);
      return;
    }
    const relogio = setTimeout(() => buscar(filtros), ESPERA_DIGITANDO);
    return () => clearTimeout(relogio);
  }, [filtros, buscar]);

  function mudar(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  return {
    filtros,
    mudar,
    limpar: () => setFiltros(FILTROS_VAZIOS),
    temFiltro: Object.values(filtros).some(Boolean),
    areas,
    voluntarios,
    carregando,
    erro,
    recarregar: () => buscar(filtros),
  };
}
