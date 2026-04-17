-- Portal Cartorial — Script de inicialização do PostgreSQL
-- Executado automaticamente pelo Docker Compose na primeira inicialização

-- ── Extensões ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- busca full-text fuzzy

-- ── Tabela: users ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL UNIQUE,
  cpf          VARCHAR(14) UNIQUE,
  password     VARCHAR(255),
  role         VARCHAR(20) NOT NULL DEFAULT 'cidadao'
                 CHECK (role IN ('cidadao', 'atendente', 'admin')),
  status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                 CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
  keycloak_id  VARCHAR(255) UNIQUE,
  phone        VARCHAR(20),
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX IF NOT EXISTS idx_users_cpf         ON users(cpf);

-- ── Tabela: document_types ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_types (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             VARCHAR(50) NOT NULL UNIQUE,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  price            DECIMAL(10, 2) NOT NULL,
  processing_days  INTEGER NOT NULL DEFAULT 3,
  required_fields  JSONB NOT NULL DEFAULT '[]',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabela: requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  attendant_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  document_type  VARCHAR(50) NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING','PAID','PROCESSING','READY','DELIVERED','CANCELLED','REJECTED')),
  amount         DECIMAL(10, 2) NOT NULL,
  payment_id     VARCHAR(255),
  document_url   TEXT,
  metadata       JSONB,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_citizen_id    ON requests(citizen_id);
CREATE INDEX IF NOT EXISTS idx_requests_status        ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_document_type ON requests(document_type);
CREATE INDEX IF NOT EXISTS idx_requests_created_at    ON requests(created_at DESC);

-- ── Trigger: atualizar updated_at automaticamente ────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed: tipos de documento ─────────────────────────────────────────────────
INSERT INTO document_types (type, name, description, price, processing_days, required_fields) VALUES
  ('CERTIDAO_NASCIMENTO',    'Certidao de Nascimento',    'Segunda via da certidao de nascimento',         45.90, 3, '["nome_registrado","data_nascimento","nome_requerente","cpf_requerente"]'),
  ('CERTIDAO_CASAMENTO',     'Certidao de Casamento',     'Segunda via da certidao de casamento',          45.90, 3, '["nome_conjuge_1","nome_conjuge_2","data_casamento"]'),
  ('CERTIDAO_OBITO',         'Certidao de Obito',         'Segunda via da certidao de obito',              45.90, 3, '["nome_falecido","data_obito","nome_requerente"]'),
  ('RECONHECIMENTO_FIRMA',   'Reconhecimento de Firma',   'Autenticacao de assinatura em documento',       25.50, 1, '["nome_signatario","tipo_documento"]'),
  ('AUTENTICACAO_DOCUMENTO', 'Autenticacao de Documento', 'Copia autenticada de documento original',      18.00, 1, '["tipo_documento","numero_paginas"]'),
  ('PROCURACAO',             'Procuracao',                'Instrumento de mandato com poderes especificos',75.00, 2, '["nome_outorgante","cpf_outorgante","nome_outorgado","poderes"]')
ON CONFLICT (type) DO NOTHING;

-- ── Seed: usuários de demonstração ───────────────────────────────────────────
-- Senhas: bcrypt de 'senha123' (cost 12)
INSERT INTO users (full_name, email, role, status) VALUES
  ('Cidadao Demo',    'cidadao@example.com',          'cidadao',   'ACTIVE'),
  ('Atendente Demo',  'atendente@cartorio.gov.br',    'atendente', 'ACTIVE'),
  ('Admin Demo',      'admin@cartorio.gov.br',         'admin',     'ACTIVE')
ON CONFLICT (email) DO NOTHING;
