-- traducoes da bio do voluntario e do titulo e da descricao do servico, para o site mostrar no idioma da bandeira
-- formato: { "bio": { "origem": "texto que foi traduzido", "pt": "...", "en": "...", "es": "...", "fr": "..." } }
-- no servico, as chaves sao "titulo" e "descricao". Null quando ainda nao tem traducao: o site mostra o original
ALTER TABLE voluntarios ADD COLUMN IF NOT EXISTS traducoes JSONB;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS traducoes JSONB;
