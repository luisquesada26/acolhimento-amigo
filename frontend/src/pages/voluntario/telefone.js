const digitos = (texto) => texto.replace(/\D/g, "");

// número de fora do Brasil fica como a pessoa digitou: começa com "+" ou passa de 11 dígitos
const estrangeiro = (texto) => texto.trimStart().startsWith("+") || digitos(texto).length > 11;

// "11987654321" vira "(11) 98765-4321"
export function formatarTelefone(numero) {
  const d = String(numero).replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return numero;
}

// o campo guarda só os dígitos, e é assim que vai para o banco; nunca corta nenhum
export function limparTelefone(valor) {
  const texto = String(valor ?? "");
  return estrangeiro(texto) ? texto : digitos(texto);
}

// "21971258464" vira "(21) 97125-8464" enquanto a pessoa digita.
// o ") " e o "-" só aparecem com o dígito seguinte, para o backspace não travar neles
export function mascaraTelefone(valor) {
  const texto = String(valor ?? "");
  if (estrangeiro(texto)) return texto;
  const d = digitos(texto);
  if (d.length <= 2) return d && `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const meio = d.length === 11 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}-${d.slice(meio)}`;
}
