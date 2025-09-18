-- Criação da tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  curso TEXT NOT NULL,
  periodo TEXT NOT NULL,
  senha TEXT NOT NULL
);