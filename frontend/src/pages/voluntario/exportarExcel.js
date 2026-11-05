import { traduzido } from "../../dados/conteudo";
import { nomeDoPais } from "../../dados/paises";
import { formatarTelefone } from "./telefone";
import { nomeDoIdioma } from "./usePainel";

// a biblioteca da planilha só baixa quando o voluntário chega no botão ou clica
const carregar = () => import("write-excel-file/browser");

export function prepararExcel() {
  carregar().catch(() => {});
}

const doisDigitos = (n) => String(n).padStart(2, "0");

// largura de cada coluna em caracteres, na ordem do cabeçalho
const LARGURAS = [28, 18, 30, 16, 26, 28, 12, 18, 14, 60];

// uma linha por atendimento, na ordem em que a lista mostra; a data sai como data do Excel em dd/mm/aaaa
export async function exportarExcel(atendimentos, t, idioma) {
  const { default: escreverPlanilha } = await carregar();

  const cabecalho = [t.pessoa, t.telefone, t.email, t.nacionalidade, t.idiomas, t.servico, t.data, t.horario, t.situacao, t.anotacao].map(
    (titulo) => ({ value: titulo, fontWeight: "bold", backgroundColor: "#E8F3EE" })
  );
  const linhas = atendimentos.map((a) => [
    a.usuario.nome,
    a.usuario.telefone ? formatarTelefone(a.usuario.telefone) : null,
    a.usuario.email || null,
    nomeDoPais(a.usuario.pais_origem) || null,
    a.usuario.idiomas.map(nomeDoIdioma).join(", "),
    traduzido(a.servico, "titulo", idioma),
    // "2026-11-04" vira meia-noite UTC, que é o que a biblioteca conta como o dia
    { value: new Date(a.horario.data), type: Date, format: "dd/mm/yyyy" },
    t.intervalo(a.horario.hora_inicio, a.horario.hora_fim),
    t.status[a.status],
    a.anotacao?.trim() ? { value: a.anotacao, wrap: true } : null,
  ]);

  const hoje = new Date();
  const data = `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}-${doisDigitos(hoje.getDate())}`;
  await escreverPlanilha([cabecalho, ...linhas], {
    sheet: t.atendimentosTitulo,
    columns: LARGURAS.map((width) => ({ width })),
    stickyRowsCount: 1,
  }).toFile(`${t.arquivoExcel}-${data}.xlsx`);
}
