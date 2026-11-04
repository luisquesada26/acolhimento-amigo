module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  // endereço do banco (o Supabase do site). No Vercel, a integração com o Supabase cria a POSTGRES_URL
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  // só faz diferença no dev local, onde o site (5173) e a API (3000) têm endereços diferentes;
  // no Vercel os dois ficam no mesmo endereço e o navegador nem confere o CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRA_EM: "7d",
  // videochamada: sem estas três chaves o agendamento funciona, só não ganha sala do Meet
  GOOGLE: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    enviarConvites: process.env.GOOGLE_ENVIAR_CONVITES === "true",
  },
  // tradução da bio e dos serviços pelo MyMemory, gratuito e sem chave. Com o e-mail, o limite
  // sobe de 5 mil para 50 mil caracteres por dia; a URL só muda nos testes
  TRADUCAO: {
    url: process.env.TRADUCAO_URL || "https://api.mymemory.translated.net/get",
    email: process.env.TRADUCAO_EMAIL,
    desligada: process.env.TRADUCAO_DESLIGADA === "1",
    // quanto cada pedido espera; passou disso, o texto fica sem tradução
    esperaMs: 4000,
  },
};
