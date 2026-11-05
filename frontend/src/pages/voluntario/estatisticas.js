import { chaveDoPais, nomeDoPais } from "../../dados/paises";

// contas dos gráficos do painel, feitas com os atendimentos que a API já manda

// "2026-11" de hoje
export function mesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

// o mês que fica n meses antes de "2026-11"
function mesesAntes(mes, n) {
  const [ano, numero] = mes.split("-").map(Number);
  const data = new Date(ano, numero - 1 - n, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

const contar = (atendimentos, status) => atendimentos.filter((a) => a.status === status).length;

// realizados e cancelados de cada mês, nos 6 meses que terminam em ultimoMes
export function porMes(atendimentos, ultimoMes, quantos = 6) {
  return Array.from({ length: quantos }, (_, i) => {
    const mes = mesesAntes(ultimoMes, quantos - 1 - i);
    const doMes = atendimentos.filter((a) => a.horario.data.startsWith(mes));
    return { mes, realizados: contar(doMes, "realizado"), cancelados: contar(doMes, "cancelado") };
  });
}

// dos atendimentos que já se encerraram (realizados e cancelados), quantos aconteceram
export function taxaDeRealizacao(atendimentos) {
  const realizados = contar(atendimentos, "realizado");
  const cancelados = contar(atendimentos, "cancelado");
  const encerrados = realizados + cancelados;
  return { realizados, cancelados, encerrados, taxa: encerrados ? realizados / encerrados : null };
}

// do maior para o menor; passando do limite, o resto vira uma linha só ("outros")
function ranking(contagem, limite = 5) {
  const lista = [...contagem.values()].sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  if (lista.length <= limite) return lista;
  const resto = lista.slice(limite);
  return [...lista.slice(0, limite), { chave: "outros", outros: true, total: resto.reduce((soma, item) => soma + item.total, 0) }];
}

export function porServico(atendimentos, nomeDoServico) {
  const contagem = new Map();
  for (const a of atendimentos) {
    const item = contagem.get(a.servico.id) ?? { chave: a.servico.id, nome: nomeDoServico(a.servico), total: 0 };
    item.total++;
    contagem.set(a.servico.id, item);
  }
  return ranking(contagem);
}

// cada pessoa conta uma vez, mesmo com vários atendimentos; "Colômbia" e "colombia" são o mesmo país
export function pessoasAtendidas(atendimentos, semPais) {
  const pessoas = new Map(atendimentos.map((a) => [a.usuario.id, a.usuario]));
  const paises = new Map();
  const idiomas = new Map();
  for (const pessoa of pessoas.values()) {
    const chave = chaveDoPais(pessoa.pais_origem);
    const pais = paises.get(chave) ?? { chave, nome: chave ? nomeDoPais(pessoa.pais_origem).trim() : semPais, total: 0 };
    pais.total++;
    paises.set(chave, pais);
    for (const codigo of pessoa.idiomas) idiomas.set(codigo, (idiomas.get(codigo) ?? 0) + 1);
  }
  return {
    pessoas: pessoas.size,
    paises: [...paises.keys()].filter(Boolean).length,
    porPais: ranking(paises),
    porIdioma: [...idiomas].map(([codigo, total]) => ({ codigo, total })).sort((a, b) => b.total - a.total),
  };
}

export const TURNOS = ["manha", "tarde", "noite"];
// de segunda a domingo (getDay: 0 é domingo)
export const DIAS = [1, 2, 3, 4, 5, 6, 0];

const turnoDe = (hora) => (hora < "12:00" ? 0 : hora < "18:00" ? 1 : 2);

// quantos atendimentos em cada dia da semana e turno; celulas[dia][turno]
export function diasETurnos(atendimentos) {
  const celulas = Array.from({ length: 7 }, () => [0, 0, 0]);
  for (const a of atendimentos) celulas[a.inicio.getDay()][turnoDe(a.horario.hora_inicio)]++;

  let topo = null;
  for (const dia of DIAS) {
    celulas[dia].forEach((total, turno) => {
      if (total > (topo?.total ?? 0)) topo = { dia, turno: TURNOS[turno], total };
    });
  }
  return { celulas, maximo: topo?.total ?? 0, topo };
}
