const db = require("../database/conexao");

// devolve os horarios dos agendamentos confirmados do usuario para a agenda do voluntario
function liberarHorariosDoUsuario(usuarioId) {
  db.prepare(`
    UPDATE horarios SET status = 'livre'
    WHERE id IN (SELECT horario_id FROM agendamentos WHERE usuario_id = ? AND status = 'confirmado')
  `).run(usuarioId);
}

module.exports = { liberarHorariosDoUsuario };
