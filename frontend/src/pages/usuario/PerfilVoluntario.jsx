import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { lerErro } from "../../services/api";
import Avatar from "../../components/Avatar";
import { nomeDoIdioma } from "../voluntario/usePainel";
import { Janela, Svg, dataComAno } from "../voluntario/comum";
import { EtiquetaArea, momento } from "./comum";
import { useTextos } from "../../context/IdiomaContext";
import { traducoes } from "./traducoes";
import CalendarioHorarios from "./CalendarioHorarios";

const MINIMO_DESCRICAO = 20;

function FormMarcar({ voluntario, horario, aoMarcado }) {
  const t = useTextos(traducoes).voluntario;
  const [servicoId, setServicoId] = useState(String(voluntario.servicos[0]?.id ?? ""));
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const faltam = MINIMO_DESCRICAO - descricao.trim().length;

  async function enviar(evento) {
    evento.preventDefault();
    if (!servicoId) return setErro(t.escolhaServico);
    if (faltam > 0) return setErro(t.conteMais(faltam));

    setEnviando(true);
    setErro("");
    try {
      await api.post("/agendamentos", {
        horario_id: horario.id,
        servico_id: Number(servicoId),
        descricao: descricao.trim(),
      });
      aoMarcado();
    } catch (problema) {
      setErro(lerErro(problema).mensagem);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario usu-form-marcar" onSubmit={enviar} noValidate>
      <p className="usu-marcar-quando">
        <Svg nome="agenda" tamanho={18} />
        <span>
          <strong>{dataComAno(momento(horario))}</strong>
          <small>
            {t.horarioCom(horario.hora_inicio, horario.hora_fim, voluntario.nome)}
          </small>
        </span>
      </p>

      <div className="campo">
        <label htmlFor="marcar-servico">{t.servico}</label>
        <select id="marcar-servico" value={servicoId} onChange={(e) => setServicoId(e.target.value)}>
          {voluntario.servicos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.titulo} ({s.duracao_min} min)
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="marcar-descricao">{t.oQuePrecisa}</label>
        <textarea
          id="marcar-descricao"
          rows={4}
          maxLength={1000}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder={t.descricaoExemplo}
        />
        <span className="dica">
          {faltam > 0 ? t.faltam(faltam, MINIMO_DESCRICAO) : t.podeEnviar}
        </span>
      </div>

      {erro && (
        <p className="vol-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="vol-acoes">
        <button type="submit" className="botao botao-primario" disabled={enviando}>
          {enviando ? t.marcando : t.confirmar}
        </button>
      </div>
    </form>
  );
}

export default function PerfilVoluntario() {
  const { id } = useParams();
  const tudo = useTextos(traducoes);
  const t = tudo.voluntario;
  const [voluntario, setVoluntario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [escolhido, setEscolhido] = useState(null);
  const [marcado, setMarcado] = useState(null);
  const avisoMarcado = useRef(null);

  // recarregar depois de marcar não troca a página por "Carregando", senão ela pisca e volta para o topo
  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get(`/voluntarios/${id}`);
      setVoluntario(data);
      setErro("");
    } catch (problema) {
      setErro(lerErro(problema).mensagem);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);

  // o aviso fica no topo; quem marcou um horário lá embaixo precisa ver que deu certo
  useEffect(() => {
    if (marcado) avisoMarcado.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [marcado]);

  if (carregando) {
    return (
      <p className="usu-estado" role="status">
        {t.carregando}
      </p>
    );
  }

  if (erro) {
    return (
      <div className="usu-estado">
        <p className="aviso" role="alert">
          {erro}
        </p>
        <Link to="/usuario" className="botao botao-primario">
          {t.voltar}
        </Link>
      </div>
    );
  }

  // depois de marcar, o horário sai da agenda: recarrega e mostra a confirmação
  function confirmado() {
    setMarcado(escolhido);
    setEscolhido(null);
    carregar();
  }

  return (
    <>
      <Link to="/usuario" className="usu-voltar">
        <Svg nome="anterior" tamanho={16} /> {t.voltar}
      </Link>

      <header className="usu-perfil-topo">
        <Avatar nome={voluntario.nome} foto={voluntario.foto} className="usu-perfil-avatar" />
        <div>
          <h1>{voluntario.nome}</h1>
          <EtiquetaArea nome={voluntario.area} />
          <ul className="usu-perfil-dados">
            <li>
              <Svg nome="idioma" tamanho={15} /> {tudo.fala(voluntario.idiomas.map(nomeDoIdioma))}
            </li>
            {voluntario.registro_profissional && (
              <li>
                <Svg nome="registro" tamanho={15} /> {voluntario.registro_profissional}
              </li>
            )}
          </ul>
        </div>
      </header>

      {voluntario.bio && <p className="usu-perfil-bio">{voluntario.bio}</p>}

      {marcado && (
        <div className="usu-confirmado" role="status" ref={avisoMarcado}>
          <Svg nome="check" tamanho={20} />
          <span>
            <strong>{t.marcado}</strong>
            <small>
              {t.marcadoTexto(dataComAno(momento(marcado)), marcado.hora_inicio)}
            </small>
          </span>
          <Link to="/usuario/atendimentos" className="usu-confirmado-link">
            {t.verMeus}
          </Link>
        </div>
      )}

      <section className="usu-bloco" aria-labelledby="usu-servicos-titulo">
        <h2 id="usu-servicos-titulo" className="usu-bloco-titulo">
          {t.oQueAtende(voluntario.nome.split(" ")[0])}
        </h2>
        <ul className="usu-servicos">
          {voluntario.servicos.map((s) => (
            <li key={s.id}>
              <h3>{s.titulo}</h3>
              <p>{s.descricao}</p>
              <span className="usu-duracao">
                <Svg nome="relogio" tamanho={15} /> {s.duracao_min} min
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="usu-bloco" aria-labelledby="usu-horarios-titulo">
        <h2 id="usu-horarios-titulo" className="usu-bloco-titulo">
          {t.horariosLivres}
        </h2>

        {voluntario.horarios.length ? (
          <CalendarioHorarios horarios={voluntario.horarios} aoEscolher={setEscolhido} />
        ) : (
          <p className="vol-vazio">{t.semHorarios}</p>
        )}
      </section>

      <Janela aberta={Boolean(escolhido)} titulo={t.marcarAtendimento} aoFechar={() => setEscolhido(null)}>
        {escolhido && <FormMarcar voluntario={voluntario} horario={escolhido} aoMarcado={confirmado} />}
      </Janela>
    </>
  );
}
