const { Router } = require("express");
const controller = require("../controllers/voluntariosController");
const validar = require("../middlewares/validar");
const { criarVoluntarioSchema, atualizarVoluntarioSchema } = require("../schemas/voluntariosSchema");

const router = Router();

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", validar(criarVoluntarioSchema), controller.criar);
router.put("/:id", validar(atualizarVoluntarioSchema), controller.atualizar);
router.delete("/:id", controller.excluir);

module.exports = router;
