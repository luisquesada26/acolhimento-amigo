const { Router } = require("express");
const controller = require("../controllers/servicosController");
const validar = require("../middlewares/validar");
const { criarServicoSchema, atualizarServicoSchema } = require("../schemas/servicosSchema");

const router = Router();

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", validar(criarServicoSchema), controller.criar);
router.put("/:id", validar(atualizarServicoSchema), controller.atualizar);
router.delete("/:id", controller.excluir);

module.exports = router;
