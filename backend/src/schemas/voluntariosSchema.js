const { z } = require("zod");
const { camposUsuario, dadosVoluntario } = require("./usuariosSchema");

const criarVoluntarioSchema = z.object({
  ...camposUsuario,
  idioma: camposUsuario.idioma.default("pt"),
  aceite_lgpd: z.literal(true, { error: "É preciso aceitar os termos de privacidade (LGPD)" }),
  voluntario: dadosVoluntario,
});

const atualizarVoluntarioSchema = dadosVoluntario
  .extend({ ativo: z.boolean() })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Nenhum campo para atualizar" });

module.exports = { criarVoluntarioSchema, atualizarVoluntarioSchema };
