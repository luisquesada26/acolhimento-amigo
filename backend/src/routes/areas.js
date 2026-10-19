const { Router } = require("express");
const controller = require("../controllers/areasController");
const autenticar = require("../middlewares/auth");
const exigirPerfil = require("../middlewares/perfil");
const validar = require("../middlewares/validar");
const { areaSchema } = require("../schemas/areasSchema");

const router = Router();

router.get("/", controller.listar);
router.get("/:id", controller.buscar);

// ainda nao existe perfil de administrador, entao quem cuida das areas sao os voluntarios
router.post("/", autenticar, exigirPerfil("voluntario"), validar(areaSchema), controller.criar);
router.put("/:id", autenticar, exigirPerfil("voluntario"), validar(areaSchema), controller.atualizar);
router.delete("/:id", autenticar, exigirPerfil("voluntario"), controller.excluir);

module.exports = router;
