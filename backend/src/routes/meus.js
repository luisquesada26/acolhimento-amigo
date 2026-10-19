const { Router } = require("express");
const servicos = require("../controllers/servicosController");
const horarios = require("../controllers/horariosController");
const autenticar = require("../middlewares/auth");
const exigirPerfil = require("../middlewares/perfil");

// "o que e meu": cada um so recebe os proprios dados, pelo token
const router = Router();

router.get("/meus-servicos", autenticar, exigirPerfil("voluntario"), servicos.meus);
router.get("/meus-horarios", autenticar, exigirPerfil("voluntario"), horarios.meus);

module.exports = router;
