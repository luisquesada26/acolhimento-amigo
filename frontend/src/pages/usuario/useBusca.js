import { useCallback, useEffect, useRef, useState } from "react";
import api, { lerErro } from "../../services/api";

const ESPERA_DIGITANDO = 350;

const FILTROS_VAZIOS = { q: "", area: "", idioma: "", disponivel: "" };

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
      const params = Object.fromEntries(Object.entries(atuais).filter(([, valor]) => valor !== ""));
      const { data } = await api.get("/voluntarios", { params });
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
