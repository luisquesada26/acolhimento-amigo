const { Router } = require("express");
const controller = require("../controllers/voluntariosController");

const router = Router();

// busca e perfil publico, sem login
router.get("/", controller.listar);
router.get("/:id", controller.buscar);

module.exports = router;
