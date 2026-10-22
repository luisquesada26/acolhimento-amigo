const bcrypt = require("bcrypt");
const { formatarData, diaMais } = require("../utils/datas");

const SENHA_PADRAO = "senha123";

const areas = [
  "Jurídico",
  "Psicologia",
  "Assistência social",
  "Aulas de português",
  "Recolocação profissional",
  "Mentoria de carreira",
  "Revalidação de diplomas",
  "Educação financeira",
  "Empreendedorismo",
  "Orientação em saúde",
  "Moradia",
  "Informática básica",
];

// 5 voluntarios por area
const voluntarios = [
  {
    area: "Jurídico",
    pessoas: [
      { nome: "Rafael Almeida", email: "voluntario@teste.com", registro: "OAB/SP 214587", idiomas: "pt,es", bio: "Advogado com experiência em direito migratório e pedidos de refúgio." },
      { nome: "Mariana Costa", email: "mariana.costa@email.com", registro: "OAB/SP 198432", idiomas: "pt,es,en", bio: "Atuo com regularização migratória e autorização de residência." },
      { nome: "Thiago Nogueira", email: "thiago.nogueira@email.com", registro: "OAB/RJ 156210", idiomas: "pt,fr", bio: "Direito trabalhista para trabalhadores imigrantes." },
      { nome: "Camila Ribeiro", email: "camila.ribeiro@email.com", registro: "OAB/SP 230011", idiomas: "pt,en", bio: "Orientação sobre documentos, CPF, CRNM e protocolo de refúgio." },
      { nome: "Eduardo Pacheco", email: "eduardo.pacheco@email.com", registro: "OAB/MG 120934", idiomas: "pt,es", bio: "Direito de família e reunião familiar para migrantes." },
    ],
    servicos: [
      { titulo: "Visto e residência", descricao: "Orientação sobre autorização de residência, renovação e documentos necessários." },
      { titulo: "Protocolo de refúgio", descricao: "Ajuda para entender o pedido de refúgio, prazos e renovação do protocolo." },
    ],
  },
  {
    area: "Psicologia",
    pessoas: [
      { nome: "Juliana Moraes", email: "juliana.moraes@email.com", registro: "CRP 06/154320", idiomas: "pt,es", bio: "Psicóloga clínica com foco em acolhimento de pessoas em situação de deslocamento." },
      { nome: "Bruno Carvalho", email: "bruno.carvalho@email.com", registro: "CRP 06/132877", idiomas: "pt,en", bio: "Atendimento para ansiedade, luto e adaptação a um novo país." },
      { nome: "Patrícia Lopes", email: "patricia.lopes@email.com", registro: "CRP 05/098765", idiomas: "pt,fr", bio: "Escuta qualificada e apoio emocional para famílias migrantes." },
      { nome: "Gabriel Fernandes", email: "gabriel.fernandes@email.com", registro: "CRP 06/176543", idiomas: "pt,es,en", bio: "Psicologia intercultural e atendimento a jovens refugiados." },
      { nome: "Larissa Teixeira", email: "larissa.teixeira@email.com", registro: "CRP 04/087321", idiomas: "pt", bio: "Apoio psicológico breve e orientação para a rede pública de saúde." },
    ],
    servicos: [
      { titulo: "Acolhimento psicológico", descricao: "Conversa inicial para entender o que você está sentindo e como podemos ajudar." },
      { titulo: "Apoio na adaptação", descricao: "Atendimento sobre saudade, solidão e as dificuldades de começar em outro país." },
    ],
  },
  {
    area: "Assistência social",
    pessoas: [
      { nome: "Renata Barbosa", email: "renata.barbosa@email.com", registro: "CRESS 9ª 54321", idiomas: "pt,es", bio: "Assistente social com experiência em CRAS e cadastro em programas sociais." },
      { nome: "Lucas Martins", email: "lucas.martins@email.com", registro: "CRESS 9ª 61234", idiomas: "pt,en", bio: "Orientação sobre Cadastro Único, Bolsa Família e acesso ao SUS." },
      { nome: "Fernanda Rocha", email: "fernanda.rocha@email.com", registro: "CRESS 7ª 43210", idiomas: "pt,fr", bio: "Apoio para matrícula escolar, moradia e abrigos." },
      { nome: "Diego Santana", email: "diego.santana@email.com", registro: "CRESS 9ª 70012", idiomas: "pt,es", bio: "Encaminhamento para emprego, carteira de trabalho e cursos gratuitos." },
      { nome: "Aline Cardoso", email: "aline.cardoso@email.com", registro: "CRESS 6ª 39876", idiomas: "pt", bio: "Atendimento a famílias e mulheres em situação de vulnerabilidade." },
    ],
    servicos: [
      { titulo: "Cadastro em programas sociais", descricao: "Ajuda para entender e se cadastrar no CadÚnico e em outros benefícios." },
      { titulo: "Orientação sobre a rede de serviços", descricao: "Onde encontrar saúde, escola, abrigo e emprego na sua cidade." },
    ],
  },
  {
    area: "Aulas de português",
    pessoas: [
      { nome: "Beatriz Souza", email: "beatriz.souza@email.com", registro: null, idiomas: "pt,es", bio: "Professora de português como língua de acolhimento." },
      { nome: "Felipe Araújo", email: "felipe.araujo@email.com", registro: null, idiomas: "pt,en,fr", bio: "Aulas de conversação para o dia a dia e para entrevistas de emprego." },
      { nome: "Carolina Mendes", email: "carolina.mendes@email.com", registro: null, idiomas: "pt,es", bio: "Português para iniciantes, com foco em situações reais." },
      { nome: "Rodrigo Freitas", email: "rodrigo.freitas@email.com", registro: null, idiomas: "pt,en", bio: "Ensino de português para quem fala inglês." },
      { nome: "Vanessa Pinto", email: "vanessa.pinto@email.com", registro: null, idiomas: "pt,fr", bio: "Aulas de português para quem fala francês." },
    ],
    servicos: [
      { titulo: "Português para iniciantes", descricao: "Primeiros passos no português: apresentação, números, compras e transporte." },
      { titulo: "Conversação", descricao: "Prática de conversa para ganhar confiança no trabalho e no dia a dia." },
    ],
  },
  {
    // aqui cada pessoa tem os proprios servicos, porque a area junta vagas, curriculo, LinkedIn e entrevista
    area: "Recolocação profissional",
    pessoas: [
      {
        nome: "Marcelo Duarte", email: "marcelo.duarte@email.com", registro: null, idiomas: "pt,es",
        bio: "Consultor de RH há 12 anos, ajudo a encontrar vagas compatíveis com a sua experiência.",
        servicos: [
          { titulo: "Plano de busca de emprego", descricao: "Montamos juntos um plano para buscar vagas de acordo com a sua experiência e a sua cidade." },
          { titulo: "Onde encontrar vagas", descricao: "Sites, agências, programas de emprego e empresas que contratam migrantes e refugiados." },
        ],
      },
      {
        nome: "Tatiane Moura", email: "tatiane.moura@email.com", registro: null, idiomas: "pt,es",
        bio: "Especialista em currículos, adapto currículos estrangeiros para o modelo usado no Brasil.",
        servicos: [
          { titulo: "Revisão de currículo", descricao: "Revisamos o seu currículo e adaptamos para o padrão brasileiro." },
          { titulo: "Carta de apresentação", descricao: "Como escrever uma carta de apresentação curta e objetiva para cada vaga." },
        ],
      },
      {
        nome: "Rogério Campos", email: "rogerio.campos@email.com", registro: null, idiomas: "pt,en",
        bio: "Ajudo a montar um LinkedIn que chama a atenção dos recrutadores.",
        servicos: [
          { titulo: "Perfil no LinkedIn", descricao: "Criação e melhoria do perfil no LinkedIn para aparecer nas buscas dos recrutadores." },
          { titulo: "Networking no LinkedIn", descricao: "Como fazer contatos, pedir indicação e se candidatar a vagas pelo LinkedIn." },
        ],
      },
      {
        nome: "Cristiane Gomes", email: "cristiane.gomes@email.com", registro: null, idiomas: "pt,fr",
        bio: "Psicóloga organizacional, conduzo processos seletivos há 10 anos.",
        servicos: [
          { titulo: "Simulação de entrevista", descricao: "Treino de entrevista com perguntas reais e retorno sobre o que melhorar." },
          { titulo: "Como funciona o processo seletivo", descricao: "Entenda as etapas, dinâmicas de grupo e testes que as empresas brasileiras usam." },
        ],
      },
      {
        nome: "Leandro Farias", email: "leandro.farias@email.com", registro: null, idiomas: "pt,es,en",
        bio: "Recrutador na área de tecnologia, mostro o que as empresas procuram no currículo e na entrevista.",
        servicos: [
          { titulo: "Currículo para vagas de tecnologia", descricao: "Ajuste do currículo e do portfólio para vagas na área de tecnologia." },
          { titulo: "Entrevista técnica", descricao: "Simulação de entrevista técnica e de conversa com o gestor da vaga." },
        ],
      },
    ],
  },
  {
    area: "Mentoria de carreira",
    pessoas: [
      { nome: "Ricardo Bastos", email: "ricardo.bastos@email.com", registro: null, idiomas: "pt,en,es", bio: "Executivo com 20 anos de carreira, mentor voluntário de jovens profissionais." },
      { nome: "Adriana Pires", email: "adriana.pires@email.com", registro: null, idiomas: "pt,es", bio: "Coach de carreira, ajudo a recomeçar e a enxergar novas possibilidades." },
      { nome: "Paulo Henrique Dias", email: "paulo.dias@email.com", registro: null, idiomas: "pt,fr", bio: "Engenheiro, oriento quem quer voltar a trabalhar na própria área." },
      { nome: "Viviane Correia", email: "viviane.correia@email.com", registro: null, idiomas: "pt,en", bio: "Mentora de mulheres migrantes que querem crescer na carreira." },
      { nome: "Sérgio Antunes", email: "sergio.antunes@email.com", registro: null, idiomas: "pt,es", bio: "Professor universitário, ajudo a escolher cursos técnicos e de qualificação." },
    ],
    servicos: [
      { titulo: "Planejamento de carreira", descricao: "Conversa para definir objetivos e os próximos passos da sua carreira no Brasil." },
      { titulo: "Cursos e qualificação", descricao: "Indicação de cursos gratuitos e técnicos de acordo com o seu objetivo." },
    ],
  },
  {
    area: "Revalidação de diplomas",
    pessoas: [
      { nome: "Mônica Figueiredo", email: "monica.figueiredo@email.com", registro: null, idiomas: "pt,es", bio: "Trabalhei na secretaria acadêmica de uma universidade federal." },
      { nome: "Jorge Medeiros", email: "jorge.medeiros@email.com", registro: null, idiomas: "pt,fr", bio: "Oriento sobre a Plataforma Carolina Bori e os documentos exigidos." },
      { nome: "Lívia Sampaio", email: "livia.sampaio@email.com", registro: null, idiomas: "pt,en", bio: "Tradutora, explico quando é preciso tradução juramentada e apostila." },
      { nome: "Otávio Rangel", email: "otavio.rangel@email.com", registro: null, idiomas: "pt,es", bio: "Ajudo profissionais da saúde a entender a revalidação e o Revalida." },
      { nome: "Isabela Quintana", email: "isabela.quintana@email.com", registro: null, idiomas: "pt,es,en", bio: "Revalidei meu próprio diploma e hoje ajudo quem está passando por isso." },
    ],
    servicos: [
      { titulo: "Revalidação de diploma", descricao: "Passo a passo para revalidar o diploma de graduação no Brasil." },
      { titulo: "Documentos e traduções", descricao: "Quais documentos separar, como apostilar e quando precisa de tradução juramentada." },
    ],
  },
  {
    area: "Educação financeira",
    pessoas: [
      { nome: "Daniela Prado", email: "daniela.prado@email.com", registro: null, idiomas: "pt,es", bio: "Bancária, ajudo a abrir conta e a entender como funciona o banco no Brasil." },
      { nome: "Márcio Tavares", email: "marcio.tavares@email.com", registro: null, idiomas: "pt,en", bio: "Planejador financeiro, monto orçamento simples para quem está começando." },
      { nome: "Kelly Andrade", email: "kelly.andrade@email.com", registro: null, idiomas: "pt,fr", bio: "Oriento sobre Pix, cartão e como evitar golpes." },
      { nome: "Wagner Lima", email: "wagner.lima@email.com", registro: null, idiomas: "pt,es", bio: "Explico como enviar dinheiro para a família no exterior pagando menos." },
      { nome: "Bianca Furtado", email: "bianca.furtado@email.com", registro: null, idiomas: "pt", bio: "Educadora financeira, ajudo a sair das dívidas e a guardar dinheiro." },
    ],
    servicos: [
      { titulo: "Conta, Pix e cartão", descricao: "Como abrir conta, usar o Pix com segurança e evitar golpes." },
      { titulo: "Orçamento da família", descricao: "Montamos juntos um orçamento para organizar os gastos do mês." },
    ],
  },
  {
    area: "Empreendedorismo",
    pessoas: [
      { nome: "Roberta Nunes", email: "roberta.nunes@email.com", registro: null, idiomas: "pt,es", bio: "Consultora de pequenos negócios, ajudo a tirar a ideia do papel." },
      { nome: "Cláudio Mendonça", email: "claudio.mendonca@email.com", registro: null, idiomas: "pt,en", bio: "Contador, explico como abrir e manter um MEI." },
      { nome: "Sabrina Coelho", email: "sabrina.coelho@email.com", registro: null, idiomas: "pt,fr", bio: "Ajudo a vender pelas redes sociais e pelo WhatsApp." },
      { nome: "Alexandre Peixoto", email: "alexandre.peixoto@email.com", registro: null, idiomas: "pt,es", bio: "Empreendedor na área de alimentação, oriento quem quer vender comida." },
      { nome: "Jéssica Amaral", email: "jessica.amaral@email.com", registro: null, idiomas: "pt,es", bio: "Explico como emitir nota fiscal e precificar produtos e serviços." },
    ],
    servicos: [
      { titulo: "Abrir um MEI", descricao: "Passo a passo para formalizar o seu negócio como MEI e emitir nota fiscal." },
      { titulo: "Vender mais", descricao: "Dicas para divulgar e vender o seu produto ou serviço pela internet." },
    ],
  },
  {
    area: "Orientação em saúde",
    pessoas: [
      { nome: "Silvia Rezende", email: "silvia.rezende@email.com", registro: "COREN-SP 412398", idiomas: "pt,es", bio: "Enfermeira da atenção básica, explico como funciona o posto de saúde e o SUS." },
      { nome: "Antônio Galvão", email: "antonio.galvao@email.com", registro: "COREN-SP 398761", idiomas: "pt,fr", bio: "Enfermeiro, atendo muitas famílias haitianas na UBS onde trabalho." },
      { nome: "Helena Bragança", email: "helena.braganca@email.com", registro: "CRF-SP 87654", idiomas: "pt,en", bio: "Farmacêutica, oriento sobre remédios gratuitos e a Farmácia Popular." },
      { nome: "Mateus Correia", email: "mateus.correia@email.com", registro: "COREN-RJ 276543", idiomas: "pt,es", bio: "Trabalho com saúde da família e vacinação de adultos e crianças." },
      { nome: "Raquel Antunes", email: "raquel.antunes@email.com", registro: "COREN-SP 455120", idiomas: "pt,en", bio: "Enfermeira obstetra, oriento gestantes sobre o pré-natal no SUS." },
    ],
    servicos: [
      { titulo: "Como usar o SUS", descricao: "Como tirar o Cartão SUS, encontrar a UBS mais perto e marcar consulta." },
      { titulo: "Vacinas e documentos de saúde", descricao: "Quais vacinas tomar, como pegar a carteira de vacinação e levar exames do seu país." },
    ],
  },
  {
    area: "Moradia",
    pessoas: [
      { nome: "Fernando Ventura", email: "fernando.ventura@email.com", registro: null, idiomas: "pt,es", bio: "Corretor de imóveis, explico como alugar sem fiador e sem cair em golpe." },
      { nome: "Cíntia Barreto", email: "cintia.barreto@email.com", registro: null, idiomas: "pt,en", bio: "Trabalho em uma ONG de moradia e conheço os programas de aluguel social." },
      { nome: "Rubens Calado", email: "rubens.calado@email.com", registro: null, idiomas: "pt,fr", bio: "Administrador de condomínios, ajudo a entender contrato, condomínio e contas." },
      { nome: "Lorena Dutra", email: "lorena.dutra@email.com", registro: null, idiomas: "pt,es", bio: "Assistente social em centro de acolhida, oriento sobre abrigos e vagas." },
      { nome: "Caio Bittencourt", email: "caio.bittencourt@email.com", registro: null, idiomas: "pt,es,en", bio: "Ajudo a comparar bairros, transporte e custo de vida antes de alugar." },
    ],
    servicos: [
      { titulo: "Alugar um imóvel", descricao: "Documentos, fiador, caução e o que conferir no contrato antes de assinar." },
      { titulo: "Abrigos e aluguel social", descricao: "Onde encontrar acolhida temporária e como pedir ajuda com o aluguel." },
    ],
  },
  {
    area: "Informática básica",
    pessoas: [
      { nome: "Bruna Leal", email: "bruna.leal@email.com", registro: null, idiomas: "pt,es", bio: "Professora de informática, ensino o básico do computador e do celular." },
      { nome: "Igor Marques", email: "igor.marques@email.com", registro: null, idiomas: "pt,en", bio: "Desenvolvedor, ajudo a criar e-mail e a usar os aplicativos do governo." },
      { nome: "Elisa Cardim", email: "elisa.cardim@email.com", registro: null, idiomas: "pt,fr", bio: "Ensino a usar o gov.br, a carteira de trabalho digital e o app do SUS." },
      { nome: "Renan Toledo", email: "renan.toledo@email.com", registro: null, idiomas: "pt,es", bio: "Técnico de suporte, explico como se proteger de golpes na internet." },
      { nome: "Yasmin Haddad", email: "yasmin.haddad@email.com", registro: null, idiomas: "pt,en", bio: "Aulas de informática em português e inglês." },
    ],
    servicos: [
      { titulo: "Primeiros passos no celular e no computador", descricao: "Criar e-mail, mandar arquivos, usar WhatsApp e fazer videochamada." },
      { titulo: "Serviços do governo na internet", descricao: "Como criar a conta gov.br e usar a carteira de trabalho digital e outros apps." },
    ],
  },
];

const usuarios = [
  { nome: "Carlos Mendoza", email: "usuario@teste.com", telefone: "11987654321", pais: "Venezuela", idioma: "es" },
  { nome: "Wideline Joseph", email: "wideline.joseph@email.com", telefone: "11976543210", pais: "Haiti", idioma: "fr" },
  { nome: "Ahmad Khalil", email: "ahmad.khalil@email.com", telefone: "11965432109", pais: "Síria", idioma: "en" },
  { nome: "María Fernanda Ríos", email: "maria.rios@email.com", telefone: "11954321098", pais: "Colômbia", idioma: "es" },
  { nome: "João Baptista Mbala", email: "joao.mbala@email.com", telefone: "11943210987", pais: "Angola", idioma: "pt" },
];

function seed(db) {
  const hash = bcrypt.hashSync(SENHA_PADRAO, 10);

  const inserirArea = db.prepare("INSERT INTO areas (nome) VALUES (?)");
  const inserirUsuario = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, telefone, perfil, pais_origem, idioma, aceite_lgpd)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const inserirVoluntario = db.prepare(`
    INSERT INTO voluntarios (usuario_id, area_id, registro_profissional, idiomas, bio)
    VALUES (?, ?, ?, ?, ?)
  `);
  const inserirServico = db.prepare("INSERT INTO servicos (voluntario_id, titulo, descricao) VALUES (?, ?, ?)");
  const inserirHorario = db.prepare(`
    INSERT INTO horarios (voluntario_id, data, hora_inicio, hora_fim, status) VALUES (?, ?, ?, ?, ?)
  `);
  const inserirAgendamento = db.prepare(`
    INSERT INTO agendamentos (horario_id, usuario_id, servico_id, descricao, status) VALUES (?, ?, ?, ?, ?)
  `);

  const popular = db.transaction(() => {
    const idsAreas = {};
    for (const nome of areas) {
      idsAreas[nome] = inserirArea.run(nome).lastInsertRowid;
    }

    const idsUsuarios = usuarios.map((u) =>
      inserirUsuario.run(u.nome, u.email, hash, u.telefone, "usuario", u.pais, u.idioma).lastInsertRowid
    );

    // guarda o primeiro servico e os horarios de cada voluntario para montar os agendamentos
    const vols = [];
    let indice = 0;

    for (const grupo of voluntarios) {
      for (const p of grupo.pessoas) {
        const usuarioId = inserirUsuario.run(p.nome, p.email, hash, null, "voluntario", "Brasil", "pt").lastInsertRowid;
        const voluntarioId = inserirVoluntario.run(usuarioId, idsAreas[grupo.area], p.registro, p.idiomas, p.bio).lastInsertRowid;

        const servicos = (p.servicos ?? grupo.servicos).map((s) => inserirServico.run(voluntarioId, s.titulo, s.descricao).lastInsertRowid);

        // metade atende de manha, metade a noite
        const horas = indice % 2 === 0 ? [["09:00", "09:45"], ["10:00", "10:45"]] : [["19:00", "19:45"], ["20:00", "20:45"]];
        const horarios = [];

        for (let d = 1; d <= 14; d++) {
          const data = diaMais(d);
          const diaSemana = data.getDay();
          if (diaSemana === 0 || diaSemana === 6) continue;

          for (const [inicio, fim] of horas) {
            horarios.push(inserirHorario.run(voluntarioId, formatarData(data), inicio, fim, "livre").lastInsertRowid);
          }
        }

        vols.push({ voluntarioId, servicos, horarios, horas });
        indice++;
      }
    }

    const reservar = db.prepare("UPDATE horarios SET status = 'reservado' WHERE id = ?");

    function agendar(usuarioIdx, volIdx, horarioIdx, descricao, status = "confirmado") {
      const v = vols[volIdx];
      const horarioId = v.horarios[horarioIdx];
      if (status !== "cancelado") reservar.run(horarioId);
      inserirAgendamento.run(horarioId, idsUsuarios[usuarioIdx], v.servicos[0], descricao, status);
    }

    agendar(0, 0, 0, "Meu protocolo de refúgio vence mês que vem e não sei como renovar.");
    agendar(0, 5, 2, "Estou com muita ansiedade desde que cheguei e não consigo dormir direito.");
    agendar(0, 15, 3, "Quero aprender o básico de português para conseguir um emprego.", "cancelado");
    agendar(1, 10, 1, "Preciso de ajuda para fazer o Cadastro Único da minha família.");
    agendar(2, 18, 0, "Falo árabe e quero começar a estudar português do zero.");
    agendar(3, 1, 4, "Quero saber como pedir a autorização de residência para meus filhos.");
    agendar(4, 12, 2, "Procuro orientação para matricular meu filho na escola pública.");
    agendar(1, 30, 1, "Sou enfermeira formada no Haiti e quero saber como revalidar meu diploma.");
    agendar(4, 21, 3, "Meu currículo está no modelo de Angola e não estou sendo chamado para entrevistas.");

    // um atendimento que ja aconteceu, para testar o status realizado
    const passado = vols[0];
    const [inicio, fim] = passado.horas[0];
    const horarioPassado = inserirHorario.run(passado.voluntarioId, formatarData(diaMais(-3)), inicio, fim, "reservado").lastInsertRowid;
    const anotar = db.prepare("UPDATE agendamentos SET anotacao = ? WHERE id = ?");
    const realizado = inserirAgendamento.run(horarioPassado, idsUsuarios[0], passado.servicos[1], "Recebi uma notificação da Polícia Federal e não entendi o que preciso fazer.", "realizado");
    anotar.run("Era uma convocação para atualizar o endereço. Orientei a levar comprovante de residência. Próximo passo: ir à Polícia Federal na data marcada.", realizado.lastInsertRowid);

    // historico do voluntario de teste (Rafael), para o painel dele ter atendimentos passados e futuros
    const rafael = vols[0];
    const diaUtil = (dias) => {
      const d = diaMais(dias);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
      return formatarData(d);
    };
    const historico = [
      [-35, 1, 0, "Cheguei do Haiti e preciso entender qual documento pedir primeiro.", "realizado", "Expliquei a ordem dos documentos: primeiro o CPF, depois a carteira de trabalho. Próximo passo: agendar o CPF na Receita Federal."],
      [-31, 3, 1, "Meu pedido de refúgio foi negado e quero saber se posso recorrer.", "realizado", "Analisamos a negativa juntos. Cabe recurso em até 15 dias. Recomendei juntar os comprovantes. Próximo passo: protocolar o recurso."],
      [-27, 4, 0, "Quero trazer minha esposa para o Brasil e não sei como pedir o visto.", "realizado", "Orientei sobre o visto de reunião familiar. Recomendei traduzir a certidão de casamento antes de pedir."],
      [-24, 2, 1, "Perdi o protocolo de refúgio e preciso de uma segunda via.", "cancelado", null],
      [-20, 1, 1, "Preciso renovar o protocolo de refúgio da minha filha.", "realizado", "Fizemos o pedido de renovação durante a chamada. Próximo passo: levar o protocolo novo à escola."],
      [-13, 3, 0, "Minha autorização de residência vence em dois meses.", "realizado", "A renovação pode ser pedida 90 dias antes. Próximo passo: agendar na Polícia Federal pelo site."],
      [-10, 4, 1, "Recebi uma intimação e não sei se preciso de advogado.", "realizado", "Expliquei a intimação: por enquanto não precisa de advogado. Recomendei comparecer com os documentos."],
    ];
    historico.forEach(([dias, usuarioIdx, servicoIdx, descricao, status, anotacao], i) => {
      const [inicio, fim] = rafael.horas[i % 2];
      const horarioId = inserirHorario.run(rafael.voluntarioId, diaUtil(dias), inicio, fim, status === "cancelado" ? "livre" : "reservado").lastInsertRowid;
      const { lastInsertRowid } = inserirAgendamento.run(horarioId, idsUsuarios[usuarioIdx], rafael.servicos[servicoIdx], descricao, status);
      if (anotacao) anotar.run(anotacao, lastInsertRowid);
    });

    // proximos do Rafael, fora dos horarios 2 a 5 que o api.http usa nos testes
    agendar(3, 0, 6, "Tenho entrevista na Polícia Federal e quero saber o que levar.");
    agendar(2, 0, 9, "Minha carteira de trabalho ainda não saiu e o protocolo vence logo.");
  });

  popular();
}

module.exports = seed;
