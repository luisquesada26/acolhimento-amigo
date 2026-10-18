// as datas ficam no horario de Brasilia (horario do computador), sem UTC

function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function diaMais(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data;
}

function agora() {
  const d = new Date();
  const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { hoje: formatarData(d), hora };
}

module.exports = { formatarData, diaMais, agora };
