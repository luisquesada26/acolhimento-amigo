const { Router } = require("express");
const controller = require("../controllers/areasController");
const validar = require("../middlewares/validar");
const { areaSchema } = require("../schemas/areasSchema");

const router = Router();

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", validar(areaSchema), controller.criar);
router.put("/:id", validar(areaSchema), controller.atualizar);
router.delete("/:id", controller.excluir);

module.exports = router;
