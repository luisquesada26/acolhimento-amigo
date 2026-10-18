const { Router } = require("express");

const router = Router();

router.get("/saude", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/areas", require("./areas"));

module.exports = router;
