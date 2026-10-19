const { z } = require("zod");

const campos = {
  titulo: z.string().trim().min(3, "O título precisa ter pelo menos 3 caracteres").max(80),
  descricao: z.string().trim().min(10, "A descrição precisa ter pelo menos 10 caracteres").max(500),
  duracao_min: z.number().int().min(15, "Duração mínima de 15 minutos").max(180, "Duração máxima de 180 minutos"),
};

// o voluntario vem do token, nao do corpo
const criarServicoSchema = z.object({
  ...campos,
  duracao_min: campos.duracao_min.default(45),
});

const atualizarServicoSchema = z
  .object({ ...campos, ativo: z.boolean() })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Nenhum campo para atualizar" });

module.exports = { criarServicoSchema, atualizarServicoSchema };
