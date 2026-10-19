const { Router } = require("express");
const controller = require("../controllers/horariosController");
const autenticar = require("../middlewares/auth");
const exigirPerfil = require("../middlewares/perfil");
const validar = require("../middlewares/validar");
const { criarHorarioSchema, atualizarHorarioSchema } = require("../schemas/horariosSchema");

// a agenda do voluntario e lida em GET /meus-horarios
const router = Router();

router.use(autenticar, exigirPerfil("voluntario"));

router.post("/", validar(criarHorarioSchema), controller.criar);
router.put("/:id", validar(atualizarHorarioSchema), controller.atualizar);
router.delete("/:id", controller.excluir);

module.exports = router;
