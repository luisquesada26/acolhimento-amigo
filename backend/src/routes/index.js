const { Router } = require("express");

const router = Router();

router.get("/saude", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", require("./auth"));
router.use("/me", require("./me"));
router.use("/areas", require("./areas"));
router.use("/usuarios", require("./usuarios"));

module.exports = router;
