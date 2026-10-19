const { Router } = require("express");
const controller = require("../controllers/agendamentosController");
const validar = require("../middlewares/validar");
const { criarAgendamentoSchema, atualizarAgendamentoSchema } = require("../schemas/agendamentosSchema");

const router = Router();

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", validar(criarAgendamentoSchema), controller.criar);
router.put("/:id", validar(atualizarAgendamentoSchema), controller.atualizar);
router.delete("/:id", controller.cancelar);

module.exports = router;
