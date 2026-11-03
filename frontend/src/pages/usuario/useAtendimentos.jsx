import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { lerErro } from "../../services/api";
import { momento } from "./comum";

const PARAMETRO = "atendimentos";

function fimDe(a) {
  return new Date(`${a.horario.data}T${a.horario.hora_fim}:00`);
}

// próximos: confirmados que ainda não acabaram. Confirmado com o horário já passado espera o voluntário confirmar
export function separar(lista, agora) {
  const grupos = { proximos: [], anteriores: [], cancelados: [] };
  for (const a of lista) {
    if (a.status === "cancelado") grupos.cancelados.push(a);
    else if (a.status === "confirmado" && fimDe(a) > agora) grupos.proximos.push(a);
    else grupos.anteriores.push(a);
  }
  const porData = (x, y) => momento(x.horario) - momento(y.horario);
  grupos.proximos.sort(porData);
  grupos.anteriores.sort((x, y) => porData(y, x));
  grupos.cancelados.sort((x, y) => porData(y, x));
  return grupos;
}

export function situacao(a, agora) {
  if (a.status === "confirmado" && fimDe(a) <= agora) return "aguardando";
  return a.status;
}

const Contexto = createContext(null);

// a lista fica no layout: o botão do topo e o painel usam a mesma, em qualquer tela do usuário
export function AtendimentosProvider({ ativo, children }) {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(() => {
    setErro("");
    api
      .get("/meus-agendamentos")
      .then(({ data }) => setLista(data))
      .catch((problema) => setErro(lerErro(problema).mensagem));
  }, []);

  useEffect(() => {
    if (ativo) carregar();
  }, [ativo, carregar]);

  const trocar = useCallback((atualizado) => {
    setLista((atual) => atual.map((a) => (a.id === atualizado.id ? atualizado : a)));
  }, []);

  const grupos = useMemo(() => separar(lista ?? [], new Date()), [lista]);
  const valor = useMemo(() => ({ lista, erro, grupos, carregar, trocar }), [lista, erro, grupos, carregar, trocar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAtendimentos() {
  return useContext(Contexto);
}

// aberto ou fechado fica no endereço (?atendimentos=1): o voltar do navegador fecha
export function useAbertura() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const aberto = params.get(PARAMETRO) === "1";

  function abrir() {
    if (aberto) return;
    params.set(PARAMETRO, "1");
    navigate({ pathname: location.pathname, search: params.toString() }, { state: { abriuAtendimentos: true } });
  }

  // quem abriu por aqui volta um passo; quem chegou pelo endereço só tira o parâmetro
  function fechar() {
    if (!aberto) return;
    if (location.state?.abriuAtendimentos) {
      navigate(-1);
      return;
    }
    params.delete(PARAMETRO);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }

  return { aberto, abrir, fechar };
}

export const ENDERECO_ABERTO = `/usuario?${PARAMETRO}=1`;
