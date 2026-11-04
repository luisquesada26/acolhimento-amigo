// o Postgres não guarda texto com o caractere nulo (\0): o pedido volta como dado inválido, e não como
// erro do servidor. A senha fica de fora porque nunca vai para o banco, só o hash dela
function temNulo(valor) {
  if (typeof valor === "string") return valor.includes("\0");
  if (valor && typeof valor === "object") return Object.entries(valor).some(([campo, v]) => campo !== "senha" && temNulo(v));
  return false;
}

function validar(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body ?? {});

    if (!resultado.success) {
      const detalhes = resultado.error.issues.map((issue) => ({
        campo: issue.path.join("."),
        mensagem: issue.message,
      }));
      return res.status(400).json({ erro: "Dados inválidos", detalhes });
    }
    if (temNulo(resultado.data)) {
      return res.status(400).json({ erro: "Dados inválidos", detalhes: [] });
    }

    req.body = resultado.data;
    next();
  };
}

module.exports = validar;
