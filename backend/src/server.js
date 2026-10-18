const app = require("./app");
const { PORT, JWT_SECRET } = require("./config/env");

if (!JWT_SECRET) {
  console.error("Falta o JWT_SECRET. Copie o backend/.env.example para backend/.env");
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}/api`);
});
