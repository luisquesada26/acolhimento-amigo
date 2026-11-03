import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import { useTextos } from "../../context/IdiomaContext";
import { Svg, hojeExtenso, primeiroNome, quando } from "./comum";
import { traducoes } from "./traducoes";

function maiuscula(texto) {
  return texto[0].toUpperCase() + texto.slice(1);
}

// o que entra no resumo do dia, igual nas três opções
function resumir(painel) {
  const hoje = new Date().toDateString();
  return {
    hoje: painel.todos.filter((a) => a.status !== "cancelado" && a.inicio.toDateString() === hoje).length,
    proximo: painel.proximo,
    marcados: painel.futuros.length,
    aguardando: painel.aguardando.length,
    naBusca: Boolean(painel.perfil.voluntario.ativo),
  };
}

// topo do painel: boas-vindas, a data e como está o dia
export default function Saudacao({ painel, opcao }) {
  const t = useTextos(traducoes);
  const s = t.saudacao;
  const r = resumir(painel);
  const data = maiuscula(hojeExtenso());
  const titulo = s.titulo(
    <span key="nome" className="saudacao-nome">
      {primeiroNome(painel.perfil.nome)}
    </span>,
  );
  const frase = r.proximo
    ? s.resumoProximo(
        <strong key="dia">{quando(r.proximo.inicio).toLowerCase()}</strong>,
        r.proximo.horario.hora_inicio,
        <strong key="nome">{r.proximo.usuario.nome}</strong>,
      )
    : s.resumoVazio;
  const proximoQuando = r.proximo ? s.proximoQuando(quando(r.proximo.inicio), r.proximo.horario.hora_inicio) : s.nadaMarcado;
  const status = r.naBusca ? s.naBusca : s.pausado;

  if (opcao === "b") {
    return (
      <header className="saudacao saudacao-b">
        <p className="saudacao-data">{data}</p>
        <h1>{titulo}</h1>
        <ul className="saudacao-chips">
          <li>
            <Svg nome="relogio" tamanho={16} />
            <span>
              {s.proximo}: <strong>{proximoQuando}</strong>
            </span>
          </li>
          <li>
            <Svg nome="atendimentos" tamanho={16} />
            {s.marcados(r.marcados)}
          </li>
          {r.aguardando > 0 && (
            <li className="saudacao-chip-alerta">
              <Svg nome="alerta" tamanho={16} />
              {s.aguardando(r.aguardando)}
            </li>
          )}
          <li className={r.naBusca ? "saudacao-chip-ativo" : undefined}>
            <span className="saudacao-bolinha"></span>
            {status}
          </li>
        </ul>
      </header>
    );
  }

  if (opcao === "c") {
    return (
      <header className="saudacao saudacao-c">
        <div className="saudacao-texto">
          <p className="saudacao-data">{data}</p>
          <h1>{titulo}</h1>
          <p className="saudacao-frase">{frase}</p>
        </div>
        <section className="saudacao-dia" aria-labelledby="saudacao-dia-titulo">
          <h2 id="saudacao-dia-titulo">{s.seuDia}</h2>
          <dl>
            <div>
              <dt>{s.hoje}</dt>
              <dd>{s.hojeN(r.hoje)}</dd>
            </div>
            <div>
              <dt>{s.proximo}</dt>
              <dd>{proximoQuando}</dd>
            </div>
            <div className={r.naBusca ? "saudacao-chip-ativo" : undefined}>
              <dt>{s.busca}</dt>
              <dd>
                <span className="saudacao-bolinha"></span>
                {status}
              </dd>
            </div>
          </dl>
        </section>
      </header>
    );
  }

  return (
    <header className="saudacao saudacao-a">
      <Avatar nome={painel.perfil.nome} foto={painel.perfil.foto} className="saudacao-avatar" />
      <div className="saudacao-texto">
        <p className="saudacao-data">{data}</p>
        <h1>{titulo}</h1>
        <p className="saudacao-frase">{frase}</p>
        <ul className="saudacao-chips">
          <li>{s.marcados(r.marcados)}</li>
          {r.aguardando > 0 && <li className="saudacao-chip-alerta">{s.aguardando(r.aguardando)}</li>}
          <li className={r.naBusca ? "saudacao-chip-ativo" : undefined}>
            <span className="saudacao-bolinha"></span>
            {status}
          </li>
        </ul>
      </div>
      <Link to="/voluntario/agenda" className="saudacao-botao">
        {s.verAgenda}
        <Svg nome="proximo" tamanho={18} />
      </Link>
    </header>
  );
}
