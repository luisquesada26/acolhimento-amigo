const { Router } = require("express");
const controller = require("../controllers/authController");
const validar = require("../middlewares/validar");
const { criarUsuarioSchema } = require("../schemas/usuariosSchema");
const { loginSchema } = require("../schemas/authSchema");

const router = Router();

router.post("/cadastro", validar(criarUsuarioSchema), controller.cadastrar);
router.post("/login", validar(loginSchema), controller.login);

module.exports = router;
