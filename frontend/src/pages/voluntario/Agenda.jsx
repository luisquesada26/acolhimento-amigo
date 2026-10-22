import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Svg, diaExtenso } from "./comum";
import DetalheAtendimento from "./DetalheAtendimento";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const VISOES = [
  { chave: "mes", nome: "Mês" },
  { chave: "semana", nome: "Semana" },
  { chave: "dia", nome: "Dia" },
];
const MAXIMO_NO_DIA = 2;

function inicioDoDia(data) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function somarDias(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

const mesmoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const maiuscula = (texto) => texto[0].toUpperCase() + texto.slice(1);
// nome e sobrenome: o primeiro e o último nome da pessoa
const nomeCurto = (nome) => {
  const partes = nome.trim().split(" ");
  return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1]}` : partes[0];
};

// os dias que aparecem na tela: o mês inteiro em semanas completas, a semana ou só o dia
function diasDaVisao(visao, referencia) {
  if (visao === "dia") return [referencia];
  if (visao === "semana") {
    const domingo = somarDias(referencia, -referencia.getDay());
    return Array.from({ length: 7 }, (_, i) => somarDias(domingo, i));
  }
  const primeiro = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const noMes = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0).getDate();
  const semanas = Math.ceil((primeiro.getDay() + noMes) / 7);
  const inicio = somarDias(primeiro, -primeiro.getDay());
  return Array.from({ length: semanas * 7 }, (_, i) => somarDias(inicio, i));
}

function tituloDaVisao(visao, referencia, dias) {
  if (visao === "mes") return maiuscula(referencia.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
  if (visao === "dia") return maiuscula(diaExtenso(referencia));
  const [ini, fim] = [dias[0], dias[6]];
  const mesFim = fim.toLocaleDateString("pt-BR", { month: "long" });
  if (ini.getMonth() === fim.getMonth()) return `${ini.getDate()} a ${fim.getDate()} de ${mesFim}`;
  return `${ini.getDate()} de ${ini.toLocaleDateString("pt-BR", { month: "long" })} a ${fim.getDate()} de ${mesFim}`;
}

function Etiqueta({ atendimento, aoAbrir, completa = false }) {
  const { horario, usuario, servico, status } = atendimento;
  return (
    <button
      type="button"
      className={`agenda-etiqueta agenda-etiqueta-${status}`}
      onClick={() => aoAbrir(atendimento.id)}
      aria-label={`${horario.hora_inicio}, ${usuario.nome}, ${servico.titulo}, ${status}`}
    >
      <span className="agenda-etiqueta-hora">{horario.hora_inicio}</span>
      <span className="agenda-etiqueta-nome">{completa ? usuario.nome : nomeCurto(usuario.nome)}</span>
      {completa && <span className="agenda-etiqueta-servico">{servico.titulo}</span>}
    </button>
  );
}

export default function Agenda() {
  const painel = useOutletContext();
  const [visao, setVisao] = useState("mes");
  const [referencia, setReferencia] = useState(() => inicioDoDia(new Date()));
  const [abertoId, setAbertoId] = useState(null);

  const hoje = inicioDoDia(new Date());
  const dias = diasDaVisao(visao, referencia);
  const doDia = (dia) => painel.todos.filter((a) => mesmoDia(a.inicio, dia)).sort((a, b) => a.inicio - b.inicio);
  const livresDoDia = (dia) => painel.horariosLivres.filter((h) => mesmoDia(new Date(`${h.data}T00:00:00`), dia));
  const aberto = painel.todos.find((a) => a.id === abertoId) ?? null;
  // na visão do dia, atendimentos e horários livres juntos, em ordem de hora
  const itensDoDia = [
    ...doDia(referencia).map((a) => ({ hora: a.horario.hora_inicio, atendimento: a })),
    ...livresDoDia(referencia).map((h) => ({ hora: h.hora_inicio, livre: h })),
  ].sort((x, y) => x.hora.localeCompare(y.hora));

  function mover(direcao) {
    if (visao === "mes") setReferencia(new Date(referencia.getFullYear(), referencia.getMonth() + direcao, 1));
    else setReferencia(somarDias(referencia, direcao * (visao === "semana" ? 7 : 1)));
  }

  function verDia(dia) {
    setReferencia(dia);
    setVisao("dia");
  }

  const semanas = Math.ceil(dias.length / 7);
  // em tela baixa cabe só um por dia; o resto fica no +N
  const maximoNoDia = window.innerHeight < 760 ? 1 : MAXIMO_NO_DIA;

  return (
    <div className="agenda-pagina">
      <header className="painel-cabecalho painel-cabecalho-acao">
        <div>
          <h1>Agenda</h1>
          <p>Seus atendimentos no calendário. Clique em um para ver a pessoa.</p>
        </div>
        <Link to="/voluntario/perfil?aba=agenda" className="botao botao-primario botao-voluntario vol-botao-pequeno">
          <Svg nome="mais" tamanho={18} /> Abrir horários
        </Link>
      </header>

      <section className="painel-cartao agenda-calendario" aria-label="Calendário">
        <div className="agenda-barra">
          <div className="agenda-navegar">
            <button type="button" className="vol-botao-secundario" onClick={() => setReferencia(hoje)}>
              Hoje
            </button>
            <button type="button" className="pagina-icone" onClick={() => mover(-1)} aria-label="Anterior">
              <Svg nome="anterior" />
            </button>
            <button type="button" className="pagina-icone" onClick={() => mover(1)} aria-label="Próximo">
              <Svg nome="proximo" />
            </button>
            <h2 className="agenda-titulo" aria-live="polite">
              {tituloDaVisao(visao, referencia, dias)}
            </h2>
          </div>
          <div className="pagina-filtros" role="group" aria-label="Visão do calendário">
            {VISOES.map((v) => (
              <button key={v.chave} type="button" aria-pressed={visao === v.chave} onClick={() => setVisao(v.chave)}>
                {v.nome}
              </button>
            ))}
          </div>
        </div>

        <ul className="agenda-legenda" aria-label="Legenda">
          <li>
            <span className="agenda-cor agenda-etiqueta-confirmado"></span> Marcado
          </li>
          <li>
            <span className="agenda-cor agenda-etiqueta-realizado"></span> Realizado
          </li>
          <li>
            <span className="agenda-cor agenda-etiqueta-cancelado"></span> Cancelado
          </li>
          <li>
            <span className="agenda-cor agenda-livre-cor"></span> Horário livre
          </li>
        </ul>

        {visao === "dia" ? (
          <div className="agenda-dia-unico">
            {itensDoDia.length ? (
              <ul className="agenda-dia-lista">
                {itensDoDia.map((item) =>
                  item.atendimento ? (
                    <li key={`a${item.atendimento.id}`}>
                      <Etiqueta atendimento={item.atendimento} aoAbrir={setAbertoId} completa />
                    </li>
                  ) : (
                    <li key={`h${item.livre.id}`} className="agenda-vaga agenda-vaga-cartao">
                      <span className="agenda-vaga-hora">
                        <Svg nome="relogio" tamanho={16} /> {item.livre.hora_inicio} às {item.livre.hora_fim}
                      </span>
                      <span>Horário livre: ninguém marcou ainda</span>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="vol-vazio">Nada neste dia: nem atendimentos nem horários livres.</p>
            )}
          </div>
        ) : (
          <div className="agenda-rolagem">
            <div className={`agenda-grade agenda-grade-${visao}`} style={{ gridTemplateRows: `auto repeat(${semanas}, minmax(0, 1fr))` }}>
              {DIAS_SEMANA.map((nome) => (
                <div key={nome} className="agenda-cabeca" aria-hidden="true">
                  <span className="agenda-cabeca-longa">{nome}</span>
                  <span className="agenda-cabeca-curta">{nome.slice(0, 3)}</span>
                </div>
              ))}
              {dias.map((dia) => {
                const lista = doDia(dia);
                const livres = livresDoDia(dia);
                const limite = visao === "mes" ? maximoNoDia : lista.length;
                const classes = ["agenda-celula"];
                if (visao === "mes" && dia.getMonth() !== referencia.getMonth()) classes.push("agenda-fora");
                if (mesmoDia(dia, hoje)) classes.push("agenda-hoje");
                return (
                  <div key={dia.toISOString()} className={classes.join(" ")} aria-label={`${diaExtenso(dia)}: ${lista.length} atendimento(s)`}>
                    <div className="agenda-celula-topo">
                      <button type="button" className="agenda-numero" onClick={() => verDia(dia)} aria-label={`Ver ${diaExtenso(dia)}`}>
                        {dia.getDate() === 1 && visao === "mes" ? dia.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "") : dia.getDate()}
                      </button>
                      {lista.length > limite && (
                        <button type="button" className="agenda-mais" onClick={() => verDia(dia)} aria-label={`Mais ${lista.length - limite} atendimento(s)`}>
                          +{lista.length - limite}
                        </button>
                      )}
                      {livres.length > 0 && visao === "mes" && (
                        <button type="button" className="agenda-vaga" onClick={() => verDia(dia)}>
                          {livres.length} {livres.length === 1 ? "livre" : "livres"}
                        </button>
                      )}
                    </div>
                    <ul>
                      {lista.slice(0, limite).map((a) => (
                        <li key={a.id}>
                          <Etiqueta atendimento={a} aoAbrir={setAbertoId} completa={visao === "semana"} />
                        </li>
                      ))}
                      {visao === "semana" &&
                        livres.map((h) => (
                          <li key={h.id} className="agenda-vaga">
                            {h.hora_inicio} livre
                          </li>
                        ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <DetalheAtendimento atendimento={aberto} aoFechar={() => setAbertoId(null)} painel={painel} />
    </div>
  );
}
