const app = require("./app");
const { PORT, JWT_SECRET, DATABASE_URL } = require("./config/env");

if (!JWT_SECRET) {
  console.error("Falta o JWT_SECRET. Copie o backend/.env.example para backend/.env");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("Falta o endereço do banco: DATABASE_URL no backend/.env (ou POSTGRES_URL, a da integração do Vercel)");
  process.exit(1);
}

// no Express 5 o erro de porta ocupada chega aqui no callback
app.listen(PORT, (erro) => {
  if (erro) {
    console.error(`Não foi possível subir a API na porta ${PORT}: ${erro.code === "EADDRINUSE" ? "a porta já está em uso" : erro.message}`);
    process.exit(1);
  }
  console.log(`API rodando em http://localhost:${PORT}/api`);
});
