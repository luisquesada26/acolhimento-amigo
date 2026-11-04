import { useCallback, useEffect, useRef, useState } from "react";
import api, { lerErro } from "../../services/api";

const ESPERA_DIGITANDO = 350;

// quando: "" (qualquer dia), "semana" (próximos 7 dias) ou um dia AAAA-MM-DD
const FILTROS_VAZIOS = { q: "", area: "", idioma: "", turno: "", quando: "" };

const doisDigitos = (n) => String(n).padStart(2, "0");

// AAAA-MM-DD pela data local: toISOString() usa UTC e, às 22h no Brasil, já devolve o dia seguinte
export function dataLocal(dia) {
  return `${dia.getFullYear()}-${doisDigitos(dia.getMonth() + 1)}-${doisDigitos(dia.getDate())}`;
}

// o caminho de volta: new Date("2026-11-06") seria meia-noite UTC, ainda dia 5 no Brasil
export function lerDataLocal(valor) {
  const [ano, mes, dia] = valor.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

// a grade do "Escolher dia" para um mês AAAA-MM: de segunda a domingo, sempre 6 semanas (42 casas)
// para o calendário não mudar de altura. As casas fora do mês vêm null e os dias antes de hoje, livre: false
export function diasDoMes(mes, agora = new Date()) {
  const [ano, numero] = mes.split("-").map(Number);
  // getDay() conta a partir do domingo; aqui a segunda é a coluna 0
  const recuo = (new Date(ano, numero - 1, 1).getDay() + 6) % 7;
  const total = new Date(ano, numero, 0).getDate();
  const hoje = dataLocal(agora);
  return Array.from({ length: 42 }, (_, i) => {
    const dia = i - recuo + 1;
    if (dia < 1 || dia > total) return null;
    const data = new Date(ano, numero - 1, dia);
    const valor = dataLocal(data);
    return { valor, data, hoje: valor === hoje, livre: valor >= hoje };
  });
}

// anda n dias a partir de um AAAA-MM-DD; o Date resolve a virada de mês e de ano
export function somarDias(valor, n) {
  const data = lerDataLocal(valor);
  data.setDate(data.getDate() + n);
  return dataLocal(data);
}

// o mesmo dia n meses depois ou, se o mês for mais curto, o último dia dele: 31/01 mais um mês vira 28/02
export function somarMeses(valor, n) {
  const [ano, mes, dia] = valor.split("-").map(Number);
  const ultimo = new Date(ano, mes + n, 0).getDate();
  return dataLocal(new Date(ano, mes - 1 + n, Math.min(dia, ultimo)));
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
  // null até a API responder, para o número de áreas não aparecer como zero
  const [areas, setAreas] = useState(null);
  const [voluntarios, setVoluntarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // ignora a resposta de uma busca que já foi substituída por outra
  const pedido = useRef(0);

  useEffect(() => {
    api
      .get("/areas")
      .then((resposta) => setAreas(resposta.data))
      .catch(() => {});
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
    areas: areas ?? [],
    areasCarregadas: areas !== null,
    voluntarios,
    carregando,
    erro,
    recarregar: () => buscar(filtros),
  };
}
