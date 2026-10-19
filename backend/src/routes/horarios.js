const { Router } = require("express");
const controller = require("../controllers/horariosController");
const validar = require("../middlewares/validar");
const { criarHorarioSchema, atualizarHorarioSchema } = require("../schemas/horariosSchema");

const router = Router();

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", validar(criarHorarioSchema), controller.criar);
router.put("/:id", validar(atualizarHorarioSchema), controller.atualizar);
router.delete("/:id", controller.excluir);

module.exports = router;
