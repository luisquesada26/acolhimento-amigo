import { useMemo, useState } from "react";
import { localeAtual, useTextos } from "../../context/IdiomaContext";
import { Svg, dataComAno, quando } from "../voluntario/comum";
import { traducoes } from "./traducoes";
import "./calendario.css";

// a semana começa no domingo, como na agenda do voluntário
function chave(dia) {
  const m = String(dia.getMonth() + 1).padStart(2, "0");
  const d = String(dia.getDate()).padStart(2, "0");
  return `${dia.getFullYear()}-${m}-${d}`;
}

function diaDe(texto) {
  return new Date(`${texto}T00:00:00`);
}

function somarDias(dia, n) {
  const novo = new Date(dia);
  novo.setDate(novo.getDate() + n);
  return novo;
}

function domingoDe(dia) {
  return somarDias(dia, -dia.getDay());
}

function primeiroDoMes(dia) {
  return new Date(dia.getFullYear(), dia.getMonth(), 1);
}

function maiuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function Hora({ horario, aoEscolher, t }) {
  return (
    <button
      type="button"
      className="cal-hora"
      onClick={() => aoEscolher(horario)}
      aria-label={t.marcarAs(dataComAno(diaDe(horario.data)), horario.hora_inicio)}
    >
      {horario.hora_inicio}
    </button>
  );
}

// horários livres do voluntário por semana (um dia por coluna) ou por mês (grade com os dias que têm horário)
export default function CalendarioHorarios({ horarios, aoEscolher }) {
  const t = useTextos(traducoes).calendario;
  const porDia = useMemo(() => {
    const mapa = new Map();
    for (const h of horarios) {
      if (!mapa.has(h.data)) mapa.set(h.data, []);
      mapa.get(h.data).push(h);
    }
    return mapa;
  }, [horarios]);

  const hoje = diaDe(chave(new Date()));
  const primeiro = horarios[0] ? diaDe(horarios[0].data) : hoje;
  const ultimo = horarios.length ? diaDe(horarios.at(-1).data) : hoje;

  const [visao, setVisao] = useState("semana");
  const [referencia, setReferencia] = useState(primeiro);
  const [diaEscolhido, setDiaEscolhido] = useState(horarios[0]?.data ?? null);

  const locale = localeAtual();
  const nomeDia = (dia, formato) => dia.toLocaleDateString(locale, { weekday: formato }).replace(".", "");

  // semana: domingo a sábado da referência; mês: as semanas que cobrem o mês inteiro
  const inicio = visao === "semana" ? domingoDe(referencia) : domingoDe(primeiroDoMes(referencia));
  const fimDoMes = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0);
  const sabadoFinal = somarDias(fimDoMes, 6 - fimDoMes.getDay());
  const totalDias = visao === "semana" ? 7 : Math.round((sabadoFinal - inicio) / 86400000) + 1;
  const dias = Array.from({ length: totalDias }, (_, i) => somarDias(inicio, i));

  const doPeriodo = (dia) => visao === "semana" || dia.getMonth() === referencia.getMonth();
  const livres = dias.filter(doPeriodo).reduce((soma, dia) => soma + (porDia.get(chave(dia))?.length ?? 0), 0);

  const podeVoltar = visao === "semana" ? inicio > domingoDe(hoje) : primeiroDoMes(referencia) > primeiroDoMes(hoje);
  const podeAvancar = visao === "semana" ? somarDias(inicio, 7) <= ultimo : primeiroDoMes(referencia) < primeiroDoMes(ultimo);

  function andar(passo) {
    setReferencia((atual) =>
      visao === "semana" ? somarDias(atual, 7 * passo) : new Date(atual.getFullYear(), atual.getMonth() + passo, 1),
    );
  }

  // a troca de visão fica no mesmo período: semana de 8/11 vira novembro, e vice-versa
  function trocarVisao(nova) {
    if (nova === "semana" && diaMostrado) setReferencia(diaDe(diaMostrado));
    setVisao(nova);
  }

  const fimDaSemana = somarDias(inicio, 6);
  const titulo =
    visao === "semana"
      ? `${inicio.toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${fimDaSemana.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`
      : maiuscula(referencia.toLocaleDateString(locale, { month: "long", year: "numeric" }));

  const maisCedo = horarios[0];
  // no mês, o dia escolhido só vale se for deste mês; senão, o primeiro dia com horário do mês
  const mesDe = (texto) => texto.slice(0, 7);
  const mesAtual = chave(referencia).slice(0, 7);
  const diaMostrado =
    diaEscolhido && mesDe(diaEscolhido) === mesAtual && porDia.has(diaEscolhido)
      ? diaEscolhido
      : [...porDia.keys()].find((k) => mesDe(k) === mesAtual) ?? null;
  const escolhidos = diaMostrado ? porDia.get(diaMostrado) : [];

  return (
    <div className="cal">
      <div className="cal-barra">
        <div className="cal-navegar">
          <button type="button" className="cal-seta" onClick={() => andar(-1)} disabled={!podeVoltar} aria-label={visao === "semana" ? t.anteriorSemana : t.anteriorMes}>
            <Svg nome="anterior" tamanho={18} />
          </button>
          <div className="cal-periodo">
            <strong aria-live="polite">{titulo}</strong>
            <small>{visao === "semana" ? t.livresSemana(livres) : t.livresMes(livres)}</small>
          </div>
          <button type="button" className="cal-seta" onClick={() => andar(1)} disabled={!podeAvancar} aria-label={visao === "semana" ? t.proximaSemana : t.proximoMes}>
            <Svg nome="proximo" tamanho={18} />
          </button>
        </div>

        <div className="cal-opcoes">
          {maisCedo && (
            <button type="button" className="cal-mais-cedo" onClick={() => aoEscolher(maisCedo)}>
              <Svg nome="relogio" tamanho={15} /> {t.maisCedo}: {quando(diaDe(maisCedo.data))}, {maisCedo.hora_inicio}
            </button>
          )}
          <div className="cal-visao" role="group" aria-label={t.visao}>
            {["semana", "mes"].map((v) => (
              <button key={v} type="button" aria-pressed={visao === v} className={visao === v ? "cal-visao-ligada" : ""} onClick={() => trocarVisao(v)}>
                {t[v]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visao === "semana" ? (
        <ol className="cal-semana">
          {dias.map((dia) => {
            const lista = porDia.get(chave(dia)) ?? [];
            const ehHoje = chave(dia) === chave(hoje);
            const passou = dia < hoje;
            return (
              <li key={chave(dia)} className={`cal-coluna${ehHoje ? " cal-hoje" : ""}${passou ? " cal-passou" : ""}`}>
                <span className="cal-coluna-topo">
                  <small>{nomeDia(dia, "short")}</small>
                  <strong>{dia.getDate()}</strong>
                </span>
                {lista.length ? (
                  <span className="cal-horas">
                    {lista.map((h) => (
                      <Hora key={h.id} horario={h} aoEscolher={aoEscolher} t={t} />
                    ))}
                  </span>
                ) : (
                  <span className="cal-vazio">{t.semHorario}</span>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <>
          <div className="cal-mes" role="grid" aria-label={titulo}>
            {dias.slice(0, 7).map((dia) => (
              <span key={`nome-${dia.getDay()}`} className="cal-mes-nome" role="columnheader">
                {nomeDia(dia, "short")}
              </span>
            ))}
            {dias.map((dia) => {
              const k = chave(dia);
              const lista = porDia.get(k) ?? [];
              const foraDoMes = dia.getMonth() !== referencia.getMonth();
              const classes = [
                "cal-dia",
                lista.length && "cal-dia-livre",
                k === diaMostrado && "cal-dia-escolhido",
                k === chave(hoje) && "cal-hoje",
                foraDoMes && "cal-dia-fora",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={k}
                  type="button"
                  role="gridcell"
                  className={classes}
                  disabled={!lista.length}
                  aria-pressed={k === diaMostrado}
                  aria-label={`${dataComAno(dia)}${lista.length ? `, ${t.horarios(lista.length)}` : ""}`}
                  onClick={() => {
                    setDiaEscolhido(k);
                    if (foraDoMes) setReferencia(primeiroDoMes(dia));
                  }}
                >
                  <strong>{dia.getDate()}</strong>
                  {lista.length > 0 && <small>{t.horarios(lista.length)}</small>}
                </button>
              );
            })}
          </div>

          <div className="cal-dia-horas" aria-live="polite">
            {escolhidos.length ? (
              <>
                <h3>
                  {dataComAno(diaDe(diaMostrado))}
                  <small>{quando(diaDe(diaMostrado))}</small>
                </h3>
                <span className="cal-horas cal-horas-linha">
                  {escolhidos.map((h) => (
                    <Hora key={h.id} horario={h} aoEscolher={aoEscolher} t={t} />
                  ))}
                </span>
              </>
            ) : (
              <p className="cal-vazio">{t.escolhaDia}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
