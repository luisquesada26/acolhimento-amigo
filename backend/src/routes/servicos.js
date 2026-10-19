const { Router } = require("express");
const controller = require("../controllers/servicosController");
const autenticar = require("../middlewares/auth");
const exigirPerfil = require("../middlewares/perfil");
const validar = require("../middlewares/validar");
const { criarServicoSchema, atualizarServicoSchema } = require("../schemas/servicosSchema");

const router = Router();
const soVoluntario = [autenticar, exigirPerfil("voluntario")];

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", soVoluntario, validar(criarServicoSchema), controller.criar);
router.put("/:id", soVoluntario, validar(atualizarServicoSchema), controller.atualizar);
router.delete("/:id", soVoluntario, controller.excluir);

module.exports = router;
