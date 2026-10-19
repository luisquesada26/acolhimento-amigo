const { Router } = require("express");
const controller = require("../controllers/agendamentosController");
const autenticar = require("../middlewares/auth");
const exigirPerfil = require("../middlewares/perfil");
const validar = require("../middlewares/validar");
const { criarAgendamentoSchema, atualizarAgendamentoSchema } = require("../schemas/agendamentosSchema");

// a lista de cada um fica em GET /meus-agendamentos
const router = Router();

router.use(autenticar);

router.get("/:id", controller.buscar);
router.post("/", exigirPerfil("usuario"), validar(criarAgendamentoSchema), controller.criar);
router.put("/:id", validar(atualizarAgendamentoSchema), controller.atualizar);
router.delete("/:id", controller.cancelar);

module.exports = router;
