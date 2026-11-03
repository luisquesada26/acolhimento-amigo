import { useState } from "react";
import Cabecalho from "../../components/Cabecalho";
import { LANG, useIdioma } from "../../context/IdiomaContext";
import "./Inicio.css";
import {
  Users,
  BookOpen,
  Wallet,
  Store,
  Laptop,
  Scale,
  Target,
  House,
  Stethoscope,
  Brain,
  BriefcaseBusiness,
  GraduationCap,
} from "lucide-react";
import { traducoes } from "./traducoes";


// só a cor e o ícone de cada área; o título e os serviços vêm do traducoes.js, no idioma da bandeira
const servicos = [
  { id: "assistencia-social", cor: "verde", icone: Users },
  { id: "aulas-portugues", cor: "azul", icone: BookOpen },
  { id: "educacao-financeira", cor: "laranja", icone: Wallet },
  { id: "empreendedorismo", cor: "roxo", icone: Store },
  { id: "informatica-basica", cor: "azul", icone: Laptop },
  { id: "juridico", cor: "azul", icone: Scale },
  { id: "mentoria-carreira", cor: "roxo", icone: Target },
  { id: "moradia", cor: "laranja", icone: House },
  { id: "orientacao-saude", cor: "verde", icone: Stethoscope },
  { id: "psicologia", cor: "roxo", icone: Brain },
  { id: "recolocacao-profissional", cor: "azul", icone: BriefcaseBusiness },
  { id: "revalidacao-diplomas", cor: "laranja", icone: GraduationCap },
];

export default function Inicio() {
  const [areaExpandida, setAreaExpandida] = useState(null);
  const { idioma } = useIdioma();

  const t = traducoes[idioma] ?? traducoes.pt;

  return (
    <div className="pagina-inicio" lang={LANG[idioma] ?? "pt-BR"}>
      <Cabecalho t={t} />

      <main>
        {/* Apresentação principal */}
        <section id="inicio" className="secao-principal">
          <div className="conteudo-principal">
            <span className="etiqueta-principal">
              {t.heroEtiqueta}
            </span>

            <h1>
              {t.heroTitulo1} <span>{t.heroTitulo2}</span>
            </h1>

            <p>{t.heroDescricao}</p>
            
            <div className="acoes-principais">
              <a href="/login" className="botao-principal">
                {t.heroBotao}
              </a>
              
            </div>
          </div>

          <div className="imagem-principal">
            <img
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85"
              alt={t.imagemPrincipal}
            />
          </div>
        </section>

        {/* Serviços */}
        <section id="servicos" className="secao-servicos">
          <div className="titulo-secao">
            <span>{t.servicosEtiqueta}</span>
            <h2>{t.servicosTitulo}</h2>
            <p>{t.servicosDescricao}</p>
          </div>
    
          <div className="grade-servicos">
            {servicos.map((servico) => {
              const expandida = areaExpandida === servico.id;
              const areaTexto = t.areas[servico.id];
              const IconeServico = servico.icone;
              const idLista = `servicos-${servico.id}`;

              return (
                <article
                  className={`cartao-servico cartao-${servico.cor}${expandida ? " cartao-servico-aberto" : ""}`}
                  key={servico.id}
                >
                  <div className="icone-servico" aria-hidden="true">
                    <IconeServico size={25} strokeWidth={1.8} />
                  </div>

                  <div className="conteudo-cartao-servico">
                    <h3>{areaTexto.titulo}</h3>

                    <p className="resumo-area">
                      {t.servicosContagem.replace(
                        "{n}",
                        String(areaTexto.itens.length)
                      )}
                    </p>

                    <button
                      type="button"
                      className="link-servico"
                      aria-expanded={expandida}
                      aria-controls={idLista}
                      onClick={() =>
                        setAreaExpandida(expandida ? null : servico.id)
                      }
                    >
                      {expandida ? t.ocultarServicos : t.verServicos}
                    </button>

                    {expandida && (
                      <ul id={idLista} className="lista-servicos-area">
                        {areaTexto.itens.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
  
            
            
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="secao-como-funciona">
          <div className="imagem-como-funciona">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85"
              alt={t.imagemComoFunciona}
              loading="lazy"
            />
          </div>

          <div className="conteudo-como-funciona">
            <span className="etiqueta-principal">
              {t.comoEtiqueta}
            </span>
            
            <h2>{t.comoTitulo}</h2>

            <p className="descricao-como-funciona">
              {t.comoDescricao}
            </p>

            <div className="lista-etapas"> 
              {t.etapas.map((etapa, index) => (
                <article className="item-etapa" key={index}>
                  <span className="numero-etapa">
                    {index + 1}
                  </span>

                  <div>
                    <h3>{etapa.titulo}</h3>
                    <p>{etapa.descricao}</p>
                  </div>
                </article>
              ))}
            </div>

            <a href="/login?modo=cadastro" className="botao-principal">
              {t.cadastroBotao}
            </a>      
          </div>
        </section>

        {/* Mensagem final do projeto */}
        <section id="sobre" className="secao-sobre">
          <div className="conteudo-sobre">
            <span>{t.sobreEtiqueta}</span>
            <h2>{t.sobreTitulo}</h2>
            
            <p>{t.sobreDescricao}</p>
            
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="rodape-inicio">
        <div className="conteudo-rodape">
          
          <div className="marca-rodape">
            <img
              src="/images/logo-branco.svg"
              alt="Acolhimento Amigo"
              className="logo-rodape"
            />
            <span>{t.rodapeDescricao}</span>
          </div>
         
          <nav aria-label={t.navSobre}>
            <a href="#inicio">{t.navInicio}</a>
            <a href="#servicos">{t.navServicos}</a>
            <a href="#sobre">{t.navSobre}</a>
          </nav>

          <a href="#inicio" className="voltar-topo">
            {t.voltarTopo}
          </a>
          
        </div>
        
        <p className="copyright">
          © {new Date().getFullYear()} Acolhimento Amigo.
           {" "}{t.direitos}
        </p>
        
      </footer>
    </div>
  );
}
