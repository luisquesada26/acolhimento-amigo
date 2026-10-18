const { Router } = require("express");
const controller = require("../controllers/usuariosController");
const validar = require("../middlewares/validar");
const { criarUsuarioSchema, atualizarUsuarioSchema } = require("../schemas/usuariosSchema");

const router = Router();

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", validar(criarUsuarioSchema), controller.criar);
router.put("/:id", validar(atualizarUsuarioSchema), controller.atualizar);
router.delete("/:id", controller.excluir);

module.exports = router;
