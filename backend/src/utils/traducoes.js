// SQL da coluna traducoes (JSONB), usado nos repositories de voluntários e de serviços.
// Formato: { "bio": { "origem": "texto que foi traduzido", "pt": "...", "en": "...", "es": "...", "fr": "..." } }

// o parâmetro @traducoes traz só os campos que mudaram ({ campo: tradução ou null }).
// Eles entram por cima do que já está no banco, o null tira o campo, e sem nenhum campo a coluna volta a null
const JUNTAR_TRADUCOES = "traducoes = NULLIF(jsonb_strip_nulls(COALESCE(traducoes, '{}') || @traducoes::jsonb), '{}')";
const NOVAS_TRADUCOES = "NULLIF(jsonb_strip_nulls(@traducoes::jsonb), '{}')";

// a busca também olha as traduções do campo, mas só a que ainda vale (origem igual ao texto atual).
// COLLATE "C" e ILIKE, como nas colunas de texto: maiúscula não importa, acento importa
function buscaNaTraducao(tabela, campo) {
  return `EXISTS (
    SELECT 1 FROM jsonb_each_text(${tabela}.traducoes -> '${campo}') AS t(idioma, texto)
    WHERE t.idioma <> 'origem' AND ${tabela}.traducoes -> '${campo}' ->> 'origem' = ${tabela}.${campo}
      AND t.texto COLLATE "C" ILIKE @q
  )`;
}

module.exports = { JUNTAR_TRADUCOES, NOVAS_TRADUCOES, buscaNaTraducao };
