const app = require("./app");
const { PORT, JWT_SECRET } = require("./config/env");

if (!JWT_SECRET) {
  console.error("Falta o JWT_SECRET. Copie o backend/.env.example para backend/.env");
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
