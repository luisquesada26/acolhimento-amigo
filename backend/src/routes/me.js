const { Router } = require("express");
const controller = require("../controllers/meController");
const autenticar = require("../middlewares/auth");
const validar = require("../middlewares/validar");
const { atualizarUsuarioSchema } = require("../schemas/usuariosSchema");

const router = Router();

router.use(autenticar);

router.get("/", controller.ver);
router.put("/", validar(atualizarUsuarioSchema), controller.atualizar);
router.delete("/", controller.excluir);

module.exports = router;
