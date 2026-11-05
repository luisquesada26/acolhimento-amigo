import { useTextos } from "../../context/IdiomaContext";
import { hojeExtenso, primeiroNome, quando } from "./comum";
import { traducoes } from "./traducoes";

function maiuscula(texto) {
  return texto[0].toUpperCase() + texto.slice(1);
}

// topo do painel: boas-vindas, a data e um cartão com o dia
export default function Saudacao({ painel }) {
  const t = useTextos(traducoes);
  const s = t.saudacao;
  const { proximo } = painel;
  const hoje = new Date().toDateString();
  const atendimentosHoje = painel.todos.filter((a) => a.status !== "cancelado" && a.inicio.toDateString() === hoje).length;
  const naBusca = Boolean(painel.perfil.voluntario.na_busca);

  const titulo = s.titulo(
    <span key="nome" className="saudacao-nome">
      {primeiroNome(painel.perfil.nome)}
    </span>,
  );
  const frase = proximo
    ? s.resumoProximo(
        <strong key="dia">{quando(proximo.inicio).toLowerCase()}</strong>,
        proximo.horario.hora_inicio,
        <strong key="nome">{proximo.usuario.nome}</strong>,
      )
    : s.resumoVazio;

  return (
    <header className="saudacao">
      <div className="saudacao-texto">
        <p className="saudacao-data">{maiuscula(hojeExtenso())}</p>
        <h1>{titulo}</h1>
        <p className="saudacao-frase">{frase}</p>
      </div>
      <section className="saudacao-dia" aria-labelledby="saudacao-dia-titulo">
        <h2 id="saudacao-dia-titulo">{s.seuDia}</h2>
        <dl>
          <div>
            <dt>{s.hoje}</dt>
            <dd>{s.hojeN(atendimentosHoje)}</dd>
          </div>
          <div>
            <dt>{s.proximo}</dt>
            <dd>{proximo ? s.proximoQuando(quando(proximo.inicio), proximo.horario.hora_inicio) : s.nadaMarcado}</dd>
          </div>
          <div className={naBusca ? "saudacao-ativo" : undefined}>
            <dt>{s.busca}</dt>
            <dd>
              <span className="saudacao-bolinha"></span>
              {naBusca ? s.naBusca : s.pausado}
            </dd>
          </div>
        </dl>
      </section>
    </header>
  );
}
