import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { lerErroSemTraduzir } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { useTextos } from "../../../context/IdiomaContext";
import { nomeDoPais } from "../../../dados/paises";
import { Aviso, Campo } from "../../login/Campos";
import { Svg } from "../../voluntario/comum";
import { limparTelefone, mascaraTelefone } from "../../voluntario/telefone";
import { traducoes } from "../traducoes";
import { EscolhaIdiomas, FotoPerfil, ListaPaises, useErros, usePaisNaBandeira, validarPerfil } from "./pecasPerfil";
import "./perfil.css";

// tempo para a pessoa ver o passo 1 virar ✓ antes de ir para a busca; no celular os passos ficam
// lá em cima, então a tela sobe até eles e espera mais um pouco
const ESPERA_PASSO_FEITO = 700;
const ESPERA_ROLAGEM = 500;
const esperar = (ms) => new Promise((pronto) => setTimeout(pronto, ms));

// primeiro acesso: antes de buscar, a pessoa deixa o contato para o voluntário
export default function CompletarPerfil() {
  const { usuario, atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const tudo = useTextos(traducoes);
  const t = tudo.primeiro;
  const tp = tudo.perfil;
  const traduzir = useErros();
  const [dados, setDados] = useState({
    telefone: limparTelefone(usuario.telefone),
    pais_origem: nomeDoPais(usuario.pais_origem ?? ""),
    idiomas: usuario.idiomas ?? ["pt"],
    foto: usuario.foto ?? null,
  });
  usePaisNaBandeira(usuario.pais_origem, setDados);
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const passoAtual = salvo ? 1 : 0;
  const listaPassos = useRef(null);

  function mudar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setMensagem("");
    const novos = validarPerfil(dados);
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
      // o usuário completo só entra na sessão depois da pausa: com ele, o layout já troca de tela
      setSalvo(true);
      const caixa = listaPassos.current.getBoundingClientRect();
      const escondidos = caixa.top < 0 || caixa.bottom > window.innerHeight;
      if (escondidos) listaPassos.current.scrollIntoView({ behavior: "smooth", block: "center" });
      await esperar(escondidos ? ESPERA_PASSO_FEITO + ESPERA_ROLAGEM : ESPERA_PASSO_FEITO);
      atualizarUsuario(data);
      navigate("/usuario", { replace: true, state: { primeiroAcesso: true } });
    } catch (problema) {
      const { mensagem: texto, campos } = lerErroSemTraduzir(problema);
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
        <ol className="pf-passos" ref={listaPassos}>
          {t.passos.map((p, i) => (
            <li key={p.titulo} className={i < passoAtual ? "pf-passo-feito" : i === passoAtual ? "pf-passo-atual" : ""}>
              <span className="pf-passo-numero">{i < passoAtual ? <Svg nome="check" tamanho={18} /> : i + 1}</span>
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
            value={mascaraTelefone(dados.telefone)}
            onChange={(e) => mudar("telefone", limparTelefone(e.target.value))}
            erro={traduzir(erros.telefone)}
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
            erro={traduzir(erros.pais_origem)}
          />
          <ListaPaises id="pf-lista-paises" />
        </div>

        <EscolhaIdiomas valor={dados.idiomas} aoMudar={(idiomas) => mudar("idiomas", idiomas)} erro={traduzir(erros.idiomas)} />

        <Aviso texto={traduzir(mensagem)} />

        <button type="submit" className={salvo ? "botao botao-primario pf-enviar pf-enviar-salvo" : "botao botao-primario pf-enviar"} disabled={enviando}>
          {salvo ? t.salvo : enviando ? tp.salvando : t.enviar}
          {salvo ? <Svg nome="check" tamanho={18} /> : enviando ? null : <Svg nome="proximo" tamanho={18} />}
        </button>
      </form>
    </div>
  );
}
