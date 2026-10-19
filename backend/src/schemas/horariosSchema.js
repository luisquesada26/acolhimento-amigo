const { z } = require("zod");

const data = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD")
  .refine((d) => {
    // pega datas como 2026-02-31, que o Date aceitaria virando marco
    const [ano, mes, dia] = d.split("-").map(Number);
    const teste = new Date(Date.UTC(ano, mes - 1, dia));
    return teste.getUTCMonth() === mes - 1 && teste.getUTCDate() === dia;
  }, "Data inválida");

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora deve estar no formato HH:MM");

const criarHorarioSchema = z.object({
  voluntario_id: z.number().int().positive("Voluntário inválido"),
  data,
  hora_inicio: hora,
  hora_fim: hora,
});

const atualizarHorarioSchema = z
  .object({ data, hora_inicio: hora, hora_fim: hora })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "Nenhum campo para atualizar" });

module.exports = { criarHorarioSchema, atualizarHorarioSchema, data };
