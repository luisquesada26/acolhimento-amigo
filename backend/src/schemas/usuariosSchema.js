const { z } = require("zod");

// idiomas em que o voluntário atende
const IDIOMAS = ["pt", "en", "es", "fr"];

const idiomas = z
  .array(z.enum(IDIOMAS, { error: "Idioma deve ser pt, en, es ou fr" }))
  .min(1, "Informe pelo menos um idioma");

// no cadastro só a área é obrigatória; os idiomas vêm depois, ao completar o perfil
const dadosVoluntario = z.object({
  area_id: z.number().int().positive("Área inválida"),
  registro_profissional: z.string().trim().max(40).nullish(),
  idiomas: idiomas.optional(),
  bio: z.string().trim().max(500).nullish(),
});

const camposUsuario = {
  nome: z.string().trim().min(3, "O nome precisa ter pelo menos 3 caracteres").max(100),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres").max(72),
  telefone: z.string().trim().max(20).nullish(),
  pais_origem: z.string().trim().max(60).nullish(),
  idioma: z.string().trim().min(2).max(5),
};

const criarUsuarioSchema = z
  .object({
    ...camposUsuario,
    idioma: camposUsuario.idioma.default("pt"),
    perfil: z.enum(["usuario", "voluntario"], { error: "Perfil deve ser usuario ou voluntario" }),
    aceite_lgpd: z.literal(true, { error: "É preciso aceitar os termos de privacidade (LGPD)" }),
    voluntario: dadosVoluntario.optional(),
  })
  .refine((d) => d.perfil !== "voluntario" || d.voluntario, {
    message: "Voluntário precisa informar a área de atuação",
    path: ["voluntario"],
  });

// usado no PUT /me. "voluntario" so vale para quem tem perfil voluntario
const atualizarUsuarioSchema = z
  .object({
    ...camposUsuario,
    voluntario: dadosVoluntario.extend({ ativo: z.boolean() }).partial(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Nenhum campo para atualizar" });

module.exports = { criarUsuarioSchema, atualizarUsuarioSchema };
