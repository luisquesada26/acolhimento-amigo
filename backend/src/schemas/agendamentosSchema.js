const { z } = require("zod");

const descricao = z
  .string()
  .trim()
  .min(20, "Descreva o que você precisa com pelo menos 20 caracteres")
  .max(1000);

const criarAgendamentoSchema = z.object({
  usuario_id: z.number().int().positive("Usuário inválido"),
  horario_id: z.number().int().positive("Horário inválido"),
  servico_id: z.number().int().positive("Serviço inválido"),
  descricao,
});

// remarcar (horario_id), marcar como realizado (status) ou corrigir a descricao
const atualizarAgendamentoSchema = z
  .object({
    horario_id: z.number().int().positive("Horário inválido"),
    status: z.literal("realizado", { error: "Para cancelar use DELETE. Aqui o status só pode ser realizado" }),
    descricao,
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Nenhum campo para atualizar" });

module.exports = { criarAgendamentoSchema, atualizarAgendamentoSchema };
