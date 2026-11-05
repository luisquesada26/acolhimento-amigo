import { Share, Smartphone, SquarePlus, X } from "lucide-react";
import { useTextos } from "../context/IdiomaContext";
import { Janela } from "../pages/voluntario/comum";
import { useInstalarApp } from "./useInstalarApp";
import { traducoes } from "./convite-instalar-traducoes";
import "./convite-instalar.css";

// no iPhone não existe o botão do navegador: a janela mostra os dois toques no Safari
function PassosIphone({ app }) {
  const t = useTextos(traducoes);

  return (
    <Janela aberta={app.passosAbertos} titulo={t.passosTitulo} aoFechar={app.fecharPassos}>
      <ol className="pwa-passos">
        <li>
          <span className="pwa-passo-icone">
            <Share size={20} aria-hidden="true" />
          </span>
          <span>
            <strong>{t.passo1}</strong> {t.passo1Detalhe}
          </span>
        </li>
        <li>
          <span className="pwa-passo-icone">
            <SquarePlus size={20} aria-hidden="true" />
          </span>
          <strong>{t.passo2}</strong>
        </li>
      </ol>
      <p className="pwa-passos-depois">{t.depois}</p>
      <button type="button" className="botao botao-primario" onClick={app.fecharPassos}>
        {t.entendi}
      </button>
    </Janela>
  );
}

// faixa no alto do conteúdo das áreas logadas; o X esconde de vez (o menu da conta continua oferecendo)
export default function ConviteInstalar({ app }) {
  const t = useTextos(traducoes);
  const mostrarFaixa = app.disponivel && !app.faixaFechada;

  return (
    <>
      {mostrarFaixa ? (
        <aside className="pwa-convite" aria-label={t.rotulo}>
          <p className="pwa-convite-texto">
            <Smartphone size={20} aria-hidden="true" />
            <span>{t.faixa}</span>
          </p>
          <div className="pwa-convite-acoes">
            <button type="button" className="pwa-convite-instalar" onClick={app.instalar}>
              {t.instalar}
            </button>
            <button type="button" className="pwa-convite-fechar" onClick={app.fecharFaixa} aria-label={t.fechar} title={t.fechar}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </aside>
      ) : null}
      <PassosIphone app={app} />
    </>
  );
}

// item "Instalar app" do menu da conta do voluntário
export function ItemInstalar({ app, aoEscolher }) {
  const t = useTextos(traducoes);
  if (!app.disponivel) return null;

  return (
    <button
      role="menuitem"
      type="button"
      className="barra-conta-item"
      onClick={() => {
        aoEscolher();
        app.instalar();
      }}
    >
      <Smartphone size={18} aria-hidden="true" />
      {t.instalar}
    </button>
  );
}

// no usuário a conta é a tela Meu perfil (o avatar leva até ela): o convite fica num bloco lá
export function SecaoInstalar() {
  const app = useInstalarApp();
  const t = useTextos(traducoes);
  if (!app.disponivel) return null;

  return (
    <section className="pwa-secao" aria-labelledby="pwa-secao-titulo">
      <span className="pwa-passo-icone">
        <Smartphone size={20} aria-hidden="true" />
      </span>
      <div className="pwa-secao-texto">
        <h2 id="pwa-secao-titulo">{t.secaoTitulo}</h2>
        <p>{t.secaoTexto}</p>
      </div>
      <button type="button" className="pwa-convite-instalar" onClick={app.instalar}>
        {t.instalar}
      </button>
      <PassosIphone app={app} />
    </section>
  );
}
