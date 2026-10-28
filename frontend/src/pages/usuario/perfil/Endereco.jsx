import { useRef, useState } from "react";
import api, { lerErro } from "../../../services/api";
import { useTextos } from "../../../context/IdiomaContext";
import { Aviso, Campo } from "../../login/Campos";
import { Svg } from "../../voluntario/comum";
import { traducoes } from "../traducoes";

const ESTADOS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const CAMPOS = ["cep", "rua", "numero", "complemento", "bairro", "cidade", "estado"];

function enderecoDe(usuario) {
  return Object.fromEntries(CAMPOS.map((c) => [c, usuario[c] ?? ""]));
}

// "01305100" vira "01305-100" enquanto a pessoa digita
function mascaraCep(cep) {
  return cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

// as linhas do cartão do perfil: "Rua Augusta, 1500 · Apto 42" e "Consolação, São Paulo/SP"
export function linhasDoEndereco(u) {
  const primeira = [[u.rua, u.numero].filter(Boolean).join(", "), u.complemento].filter(Boolean).join(" · ");
  const lugar = [u.cidade, u.estado].filter(Boolean).join("/");
  const segunda = [u.bairro, lugar].filter(Boolean).join(", ");
  return [primeira, segunda].filter(Boolean);
}

// endereço é opcional e só a própria pessoa vê; salva separado dos dados pessoais
export default function Endereco({ usuario, aoSalvar }) {
  const tudo = useTextos(traducoes);
  const t = tudo.perfil;
  const [dados, setDados] = useState(() => enderecoDe(usuario));
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [cepEstado, setCepEstado] = useState("");
  const ultimoCep = useRef("");
  const mudou = JSON.stringify(dados) !== JSON.stringify(enderecoDe(usuario));
  const vazio = CAMPOS.every((c) => !dados[c]);

  function mudar(campo, valor) {
    setSalvo(false);
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  // desfazer e limpar trocam o CEP: o aviso do CEP anterior não vale mais
  function trocarTudo(novos) {
    ultimoCep.current = "";
    setCepEstado("");
    setErros({});
    setDados(novos);
  }

  // ViaCEP: preenche o que achar; se não achar ou estiver fora do ar, a pessoa preenche à mão
  async function buscarCep(cep) {
    ultimoCep.current = cep;
    setCepEstado("buscando");
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const achado = await resposta.json();
      if (ultimoCep.current !== cep) return;
      if (achado.erro) return setCepEstado("naoEncontrado");
      setDados((atual) => ({
        ...atual,
        rua: achado.logradouro || atual.rua,
        bairro: achado.bairro || atual.bairro,
        cidade: achado.localidade || atual.cidade,
        estado: achado.uf || atual.estado,
      }));
      setCepEstado("");
      document.getElementById("pf-numero")?.focus();
    } catch {
      if (ultimoCep.current === cep) setCepEstado("");
    }
  }

  function mudarCep(valor) {
    const cep = valor.replace(/\D/g, "").slice(0, 8);
    mudar("cep", cep);
    setCepEstado("");
    if (cep.length === 8 && cep !== dados.cep) buscarCep(cep);
  }

  async function enviar(evento) {
    evento.preventDefault();
    setMensagem("");
    const novos = dados.cep && dados.cep.length !== 8 ? { cep: tudo.erros.cep } : {};
    setErros(novos);
    if (Object.keys(novos).length) return;

    setEnviando(true);
    try {
      const corpo = Object.fromEntries(CAMPOS.map((c) => [c, dados[c].trim() || null]));
      const { data } = await api.put("/me", corpo);
      aoSalvar(data);
      setDados(enderecoDe(data));
      setSalvo(true);
    } catch (problema) {
      const { mensagem: texto, campos } = lerErro(problema);
      setErros(campos);
      setMensagem(texto);
    } finally {
      setEnviando(false);
    }
  }

  const dicaCep = { buscando: t.buscandoCep, naoEncontrado: t.cepNaoEncontrado }[cepEstado] ?? t.cepDica;

  return (
    <form className="pf-secao" onSubmit={enviar} noValidate aria-labelledby="pf-endereco-titulo">
      <header className="pf-secao-topo">
        <div>
          <h2 id="pf-endereco-titulo">{t.enderecoTitulo}</h2>
          <p>{t.enderecoTexto}</p>
        </div>
      </header>

      <div className="pf-endereco">
        <div className="pf-endereco-cep">
          <Campo
            id="pf-cep"
            rotulo={t.cep}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={mascaraCep(dados.cep)}
            onChange={(e) => mudarCep(e.target.value)}
            erro={erros.cep}
          />
          {!erros.cep && (
            <span className={cepEstado === "naoEncontrado" ? "dica pf-dica-alerta" : "dica"} role="status">
              {dicaCep}
            </span>
          )}
        </div>
        <div className="pf-endereco-rua">
          <Campo id="pf-rua" rotulo={t.rua} autoComplete="address-line1" maxLength={120} value={dados.rua} onChange={(e) => mudar("rua", e.target.value)} erro={erros.rua} />
        </div>
        <div className="pf-endereco-numero">
          <Campo id="pf-numero" rotulo={t.numero} maxLength={10} value={dados.numero} onChange={(e) => mudar("numero", e.target.value)} erro={erros.numero} />
        </div>
        <div className="pf-endereco-complemento">
          <Campo
            id="pf-complemento"
            rotulo={t.complemento}
            autoComplete="address-line2"
            maxLength={60}
            placeholder={t.complementoExemplo}
            value={dados.complemento}
            onChange={(e) => mudar("complemento", e.target.value)}
            erro={erros.complemento}
          />
        </div>
        <div className="pf-endereco-bairro">
          <Campo id="pf-bairro" rotulo={t.bairro} maxLength={60} value={dados.bairro} onChange={(e) => mudar("bairro", e.target.value)} erro={erros.bairro} />
        </div>
        <div className="pf-endereco-cidade">
          <Campo id="pf-cidade" rotulo={t.cidade} autoComplete="address-level2" maxLength={60} value={dados.cidade} onChange={(e) => mudar("cidade", e.target.value)} erro={erros.cidade} />
        </div>
        <div className="campo pf-endereco-estado">
          <label htmlFor="pf-estado">{t.estado}</label>
          <select id="pf-estado" autoComplete="address-level1" value={dados.estado} onChange={(e) => mudar("estado", e.target.value)} aria-invalid={Boolean(erros.estado)}>
            <option value="">{t.escolhaEstado}</option>
            {ESTADOS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
          {erros.estado && <span className="campo-erro">{erros.estado}</span>}
        </div>
      </div>

      <Aviso texto={mensagem} />

      <div className="pf-acoes">
        {salvo && !mudou && (
          <span className="pf-salvo" role="status">
            <Svg nome="check" tamanho={16} /> {t.enderecoSalvo}
          </span>
        )}
        {!vazio && (
          <button type="button" className="pf-link pf-limpar" disabled={enviando} onClick={() => trocarTudo(Object.fromEntries(CAMPOS.map((c) => [c, ""])))}>
            {t.limparEndereco}
          </button>
        )}
        <button type="button" className="pf-botao-contorno" disabled={!mudou || enviando} onClick={() => trocarTudo(enderecoDe(usuario))}>
          {t.desfazer}
        </button>
        <button type="submit" className="botao botao-primario pf-salvar" disabled={!mudou || enviando}>
          {enviando ? t.salvando : t.salvarEndereco}
        </button>
      </div>
    </form>
  );
}
