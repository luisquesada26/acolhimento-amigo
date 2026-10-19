const { Router } = require("express");
const servicos = require("../controllers/servicosController");
const horarios = require("../controllers/horariosController");
const agendamentos = require("../controllers/agendamentosController");
const autenticar = require("../middlewares/auth");
const exigirPerfil = require("../middlewares/perfil");

// "o que e meu": cada um so recebe os proprios dados, pelo token
const router = Router();

router.get("/meus-servicos", autenticar, exigirPerfil("voluntario"), servicos.meus);
router.get("/meus-horarios", autenticar, exigirPerfil("voluntario"), horarios.meus);
router.get("/meus-agendamentos", autenticar, agendamentos.meus);

module.exports = router;
