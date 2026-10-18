const { z } = require("zod");

const areaSchema = z.object({
  nome: z.string().trim().min(3, "O nome precisa ter pelo menos 3 caracteres").max(60),
});

module.exports = { areaSchema };
