const path = require("path");

const raiz = path.resolve(__dirname, "..", "..");

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  DB_PATH: path.resolve(raiz, process.env.DB_PATH || "./data/acolhimento.db"),
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
};
