import { useState } from "react";
import { Svg, diaExtenso, useAcao } from "./comum";
import { localeAtual, useTextos } from "../../context/IdiomaContext";
import { traducoes } from "./traducoes";

const dois = (n) => String(n).padStart(2, "0");
const paraIso = (d) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
const paraMinutos = (hora) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
const paraHora = (minutos) => `${dois(Math.floor(minutos / 60))}:${dois(minutos % 60)}`;
const maiuscula = (texto) => texto[0].toUpperCase() + texto.slice(1);

// de segunda a domingo, pelo número do getDay(); o nome abreviado são as 3 primeiras letras de diasSemana
const DIAS = [1, 2, 3, 4, 5, 6, 0];

// o nome de cada filtro vem das traduções (filtrosHorarios)
const FILTROS = ["todos", "livre", "reservado"];

// monta os horários dos dias escolhidos, um atrás do outro, sem nada no passado e sem bater com os que já existem
function montarHorarios({ dias, inicio, fim, duracao, desde, semanas, existentes }) {
  const lista = [];
  const agora = new Date();
  const primeiro = new Date(`${desde}T00:00:00`);
  for (let i = 0; i < semanas * 7; i++) {
    const dia = new Date(primeiro);
    dia.setDate(dia.getDate() + i);
    if (!dias.includes(dia.getDay())) continue;
    for (let m = paraMinutos(inicio); m + duracao <= paraMinutos(fim); m += duracao) {
      const comeco = new Date(dia);
      comeco.setHours(0, m, 0, 0);
      if (comeco <= agora) continue;
      const data = paraIso(dia);
      const bate = existentes.some(
        (h) => h.data === data && paraMinutos(h.hora_inicio) < m + duracao && m < paraMinutos(h.hora_fim)
      );
      if (!bate) lista.push({ data, hora_inicio: paraHora(m), hora_fim: paraHora(m + duracao) });
    }
  }
  return lista;
}

function Disponibilidade({ criarHorarios, existentes }) {
  const [dias, setDias] = useState([1, 3]);
  const [inicio, setInicio] = useState("09:00");
  const [fim, setFim] = useState("12:00");
  const [duracao, setDuracao] = useState("45");
  const [desde, setDesde] = useState(paraIso(new Date()));
  const [semanas, setSemanas] = useState("4");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const t = useTextos(traducoes);

  const horarios = montarHorarios({ dias, inicio, fim, duracao: Number(duracao), desde, semanas: Number(semanas), existentes });

  function alternarDia(numero) {
    setDias((atuais) => (atuais.includes(numero) ? atuais.filter((d) => d !== numero) : [...atuais, numero]));
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (!dias.length) return setResultado({ erro: true, texto: t.erroDia });
    if (paraMinutos(fim) <= paraMinutos(inicio)) return setResultado({ erro: true, texto: t.erroFim });
    if (!horarios.length) return setResultado({ erro: true, texto: t.erroSemHorario });

    setEnviando(true);
    setResultado(null);
    const { criados, erros } = await criarHorarios(horarios);
    setEnviando(false);
    const texto = t.abertos(criados);
    setResultado(erros.length ? { erro: true, texto: `${texto} ${t.naoEntraram(erros.length)}` } : { erro: false, texto });
  }

  return (
    <section className="painel-cartao" aria-labelledby="disponibilidade-titulo">
      <h2 id="disponibilidade-titulo" className="painel-titulo">
        {t.quandoAtende}
      </h2>
      <form className="disponibilidade" onSubmit={enviar} noValidate>
        <fieldset className="campo">
          <legend>{t.diasDaSemana}</legend>
          <div className="perfil-chips">
            {DIAS.map((numero) => (
              <button key={numero} type="button" aria-pressed={dias.includes(numero)} onClick={() => alternarDia(numero)}>
                {dias.includes(numero) && <Svg nome="check" tamanho={16} />}
                {t.diasSemana[numero].slice(0, 3)}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="disponibilidade-campos">
          <div className="campo">
            <label htmlFor="disp-inicio">{t.dasCampo}</label>
            <input id="disp-inicio" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="disp-fim">{t.ateCampo}</label>
            <input id="disp-fim" type="time" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="disp-duracao">{t.cadaAtendimento}</label>
            <select id="disp-duracao" value={duracao} onChange={(e) => setDuracao(e.target.value)}>
              <option value="30">{t.minutos(30)}</option>
              <option value="45">{t.minutos(45)}</option>
              <option value="60">{t.umaHora}</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="disp-desde">{t.aPartirDe}</label>
            <input id="disp-desde" type="date" min={paraIso(new Date())} value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="disp-semanas">{t.por}</label>
            <select id="disp-semanas" value={semanas} onChange={(e) => setSemanas(e.target.value)}>
              <option value="1">{t.semanas(1)}</option>
              <option value="2">{t.semanas(2)}</option>
              <option value="4">{t.semanas(4)}</option>
              <option value="8">{t.semanas(8)}</option>
            </select>
          </div>
        </div>
        <div className="disponibilidade-rodape">
          <p className="dica" aria-live="polite">
            {t.issoAbre} <strong>{horarios.length}</strong> {t.unidadeHorario(horarios.length)}. {t.ficamDeFora}
          </p>
          <button type="submit" className="botao botao-primario botao-voluntario vol-botao-pequeno" disabled={enviando}>
            {enviando ? t.abrindo : t.abrirHorarios}
          </button>
        </div>
        {resultado && (
          <p className={resultado.erro ? "vol-erro" : "pagina-ok"} role={resultado.erro ? "alert" : "status"}>
            {resultado.texto}
          </p>
        )}
      </form>
    </section>
  );
}

function ExcluirHorario({ horario, excluirHorario }) {
  const [confirmando, setConfirmando] = useState(false);
  const reservado = horario.status === "reservado";
  const { executar, ocupado, erro } = useAcao(() => excluirHorario(horario.id, reservado));
  const t = useTextos(traducoes);

  if (!confirmando) {
    return (
      <button type="button" className="pagina-icone" onClick={() => setConfirmando(true)} aria-label={t.excluirHorarioDas(horario.hora_inicio)} title={t.excluir}>
        <Svg nome="lixo" tamanho={18} />
      </button>
    );
  }

  return (
    <div className="vol-confirmar agenda-confirmar">
      <span>{reservado ? t.cancelaCom(horario.agendamento?.usuario) : t.excluirEsteHorario}</span>
      <div className="vol-acoes">
        <button type="button" className="vol-botao-perigo vol-botao-cheio" onClick={executar} disabled={ocupado}>
          {ocupado ? t.excluindo : t.simExcluir}
        </button>
        <button type="button" className="vol-botao-secundario" onClick={() => setConfirmando(false)} disabled={ocupado}>
          {t.nao}
        </button>
      </div>
      {erro && <p className="vol-erro" role="alert">{erro}</p>}
    </div>
  );
}

// aba Agenda do Meu perfil: abrir horários e ver os cadastrados por mês
export default function Horarios({ horarios, criarHorarios, excluirHorario }) {
  const [filtro, setFiltro] = useState("todos");
  const t = useTextos(traducoes);
  const hoje = paraIso(new Date());

  // só de hoje em diante; o que já passou fica no histórico
  const proximos = horarios
    .filter((h) => h.data >= hoje)
    .sort((a, b) => (a.data + a.hora_inicio).localeCompare(b.data + b.hora_inicio));
  const visiveis = filtro === "todos" ? proximos : proximos.filter((h) => h.status === filtro);
  const meses = [...new Set(visiveis.map((h) => h.data.slice(0, 7)))];
  const contar = (chave) => (chave === "todos" ? proximos.length : proximos.filter((h) => h.status === chave).length);

  return (
    <>
      <Disponibilidade criarHorarios={criarHorarios} existentes={horarios} />

      <section className="painel-cartao" aria-labelledby="horarios-titulo">
        <div className="painel-cartao-topo">
          <h2 id="horarios-titulo" className="painel-titulo">
            {t.diasCadastrados}
          </h2>
          <div className="pagina-filtros" role="group" aria-label={t.filtrarHorarios}>
            {FILTROS.map((chave) => (
              <button key={chave} type="button" aria-pressed={filtro === chave} onClick={() => setFiltro(chave)}>
                {t.filtrosHorarios[chave]} ({contar(chave)})
              </button>
            ))}
          </div>
        </div>

        {meses.length ? (
          meses.map((mes) => {
            const doMes = visiveis.filter((h) => h.data.startsWith(mes));
            const dias = [...new Set(doMes.map((h) => h.data))];
            return (
              <section key={mes} className="horarios-mes" aria-label={mes}>
                <h3>{maiuscula(new Date(`${mes}-01T00:00:00`).toLocaleDateString(localeAtual(), { month: "long", year: "numeric" }))}</h3>
                <div className="agenda-dias">
                  {dias.map((dia) => (
                    <div key={dia} className="agenda-dia">
                      <h4>{diaExtenso(new Date(`${dia}T00:00:00`))}</h4>
                      <ul>
                        {doMes
                          .filter((h) => h.data === dia)
                          .map((h) => (
                            <li key={h.id} className={`agenda-horario agenda-${h.status}`}>
                              <time dateTime={`${h.data}T${h.hora_inicio}`}>
                                {t.intervalo(h.hora_inicio, h.hora_fim)}
                              </time>
                              {h.status === "reservado" ? (
                                <>
                                  <span className="vol-status vol-status-confirmado">
                                    <Svg nome="pessoas" tamanho={14} /> {t.reservado}
                                  </span>
                                  <span className="agenda-quem">
                                    {h.agendamento?.usuario} · {h.agendamento?.servico}
                                  </span>
                                </>
                              ) : (
                                <span className="vol-status vol-status-livre">
                                  <Svg nome="relogio" tamanho={14} /> {t.livre}
                                </span>
                              )}
                              <ExcluirHorario horario={h} excluirHorario={excluirHorario} />
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <p className="vol-vazio">
            {filtro === "todos" ? t.semHorariosAbertos : t.semHorarioNoFiltro}
          </p>
        )}
      </section>
    </>
  );
}
