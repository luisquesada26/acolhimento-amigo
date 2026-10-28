import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { lerErro } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { useTextos } from "../../../context/IdiomaContext";
import { Aviso, Campo } from "../../login/Campos";
import { Svg } from "../../voluntario/comum";
import { traducoes } from "../traducoes";
import { EscolhaIdiomas, FotoPerfil, ListaPaises, validarPerfil } from "./pecasPerfil";
import "./perfil.css";

// primeiro acesso: antes de buscar, a pessoa deixa o contato para o voluntário
export default function CompletarPerfil() {
  const { usuario, atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const tudo = useTextos(traducoes);
  const t = tudo.primeiro;
  const tp = tudo.perfil;
  const [dados, setDados] = useState({
    telefone: usuario.telefone ?? "",
    pais_origem: usuario.pais_origem ?? "",
    idiomas: usuario.idiomas ?? ["pt"],
    foto: usuario.foto ?? null,
  });
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  function mudar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setMensagem("");
    const novos = validarPerfil(dados, tudo.erros);
    setErros(novos);
    if (Object.keys(novos).length) return;

    setEnviando(true);
    try {
      const { data } = await api.put("/me", {
        telefone: dados.telefone.trim(),
        pais_origem: dados.pais_origem.trim(),
        idiomas: dados.idiomas,
        foto: dados.foto,
      });
      atualizarUsuario(data);
      navigate("/usuario", { replace: true });
    } catch (problema) {
      const { mensagem: texto, campos } = lerErro(problema);
      setErros(campos);
      setMensagem(texto);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pf-primeiro">
      <aside className="pf-boas-vindas">
        <span className="pf-selo">{t.selo}</span>
        <h1>
          {t.bemVindo(usuario.nome.split(" ")[0])}
          <span>{t.faltaPouco}</span>
        </h1>
        <ol className="pf-passos">
          {t.passos.map((p, i) => (
            <li key={p.titulo} className={i === 0 ? "pf-passo-atual" : ""}>
              <span className="pf-passo-numero">{i + 1}</span>
              <span>
                <strong>{p.titulo}</strong>
                <small>{p.texto}</small>
              </span>
            </li>
          ))}
        </ol>
        <p className="pf-privacidade">
          <Svg nome="alerta" tamanho={18} />
          {t.privacidade}
        </p>
      </aside>

      <form className="pf-formulario" onSubmit={enviar} noValidate>
        <header>
          <span className="pf-etapa">{t.etapa}</span>
          <h2>{t.titulo}</h2>
          <p>{t.texto}</p>
        </header>

        <FotoPerfil nome={usuario.nome} foto={dados.foto} aoMudar={(foto) => mudar("foto", foto)} />

        <div className="pf-linha">
          <Campo
            id="pf-telefone"
            rotulo={tp.telefone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            maxLength={20}
            value={dados.telefone}
            onChange={(e) => mudar("telefone", e.target.value)}
            erro={erros.telefone}
          />
          <Campo
            id="pf-pais"
            rotulo={tp.nacionalidade}
            list="pf-lista-paises"
            autoComplete="country-name"
            placeholder={tp.comeceEscrever}
            maxLength={60}
            value={dados.pais_origem}
            onChange={(e) => mudar("pais_origem", e.target.value)}
            erro={erros.pais_origem}
          />
          <ListaPaises id="pf-lista-paises" />
        </div>

        <EscolhaIdiomas valor={dados.idiomas} aoMudar={(idiomas) => mudar("idiomas", idiomas)} erro={erros.idiomas} />

        <Aviso texto={mensagem} />

        <button type="submit" className="botao botao-primario pf-enviar" disabled={enviando}>
          {enviando ? tp.salvando : t.enviar}
          {!enviando && <Svg nome="proximo" tamanho={18} />}
        </button>
      </form>
    </div>
  );
}
