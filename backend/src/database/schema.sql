PRAGMA foreign_keys = ON;

CREATE TABLE usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  senha_hash    TEXT    NOT NULL,
  telefone      TEXT,
  perfil        TEXT    NOT NULL CHECK (perfil IN ('usuario', 'voluntario')),
  pais_origem   TEXT,
  idioma        TEXT    NOT NULL DEFAULT 'pt',
  aceite_lgpd   INTEGER NOT NULL DEFAULT 0,
  criado_em     TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE areas (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome  TEXT NOT NULL UNIQUE
);

CREATE TABLE voluntarios (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id             INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  area_id                INTEGER NOT NULL REFERENCES areas(id),
  registro_profissional  TEXT,              -- OAB, CRP, CRESS (professor nao precisa)
  idiomas                TEXT    NOT NULL,  -- separados por virgula: 'pt,es,ht'
  bio                    TEXT,
  ativo                  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE servicos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  voluntario_id  INTEGER NOT NULL REFERENCES voluntarios(id) ON DELETE CASCADE,
  titulo         TEXT    NOT NULL,
  descricao      TEXT    NOT NULL,
  duracao_min    INTEGER NOT NULL DEFAULT 45,
  ativo          INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE horarios (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  voluntario_id  INTEGER NOT NULL REFERENCES voluntarios(id) ON DELETE CASCADE,
  data           TEXT    NOT NULL,   -- 'AAAA-MM-DD'
  hora_inicio    TEXT    NOT NULL,   -- 'HH:MM'
  hora_fim       TEXT    NOT NULL,   -- 'HH:MM'
  status         TEXT    NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'reservado'))
);

CREATE TABLE agendamentos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  horario_id  INTEGER NOT NULL REFERENCES horarios(id) ON DELETE CASCADE,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  servico_id  INTEGER NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  descricao   TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'confirmado'
              CHECK (status IN ('confirmado', 'cancelado', 'realizado')),
  criado_em   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_horarios_voluntario_data ON horarios (voluntario_id, data);
CREATE INDEX idx_agendamentos_usuario ON agendamentos (usuario_id);
