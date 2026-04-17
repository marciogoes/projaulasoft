# ADR-003 — PostgreSQL como banco de dados principal

**Data:** 2026-02-13
**Status:** Aceito
**Decisores:** Squad Portal Cartorial

---

## Contexto

O sistema lida com pedidos de serviços cartoriais, que envolvem relacionamentos entre
cidadãos, documentos e pedidos, além de transações financeiras que exigem garantias
ACID. Os dados são estruturados e bem definidos.

## Decisão

Adotaremos **PostgreSQL 16** como banco de dados relacional principal.

## Alternativas Consideradas

| Alternativa | Prós | Contras | Motivo da Rejeição |
|---|---|---|---|
| **MongoDB** | Schema flexível, JSON nativo | Sem ACID por padrão, sem JOINs nativos | Dados são relacionais |
| **MySQL** | Maduro, popular | Menos recursos avançados que PostgreSQL | PostgreSQL supera em recursos |
| **SQLite** | Zero configuração | Não escala para concorrência | Ambiente de produção |
| **PostgreSQL 16** ✅ | ACID, JSON nativo (jsonb), extensível | Setup mais complexo que SQLite | **Escolhido** |

## Consequências

**Positivo:**
- ACID garante consistência das transações financeiras
- `jsonb` para o campo `metadata` dos pedidos (dados variáveis por tipo de documento)
- TypeORM tem suporte excelente ao PostgreSQL

**Negativo:**
- Requer serviço dedicado (Docker service no ambiente de desenvolvimento)
- Migrações necessárias para evolução do schema

## Schema Inicial

```sql
-- Tabela principal de pedidos
CREATE TABLE requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id     UUID NOT NULL,
  document_type  VARCHAR NOT NULL,
  status         VARCHAR NOT NULL DEFAULT 'PENDING',
  amount         DECIMAL(10,2) NOT NULL,
  metadata       JSONB,           -- dados variáveis por tipo de doc
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
```

O uso de `jsonb` para `metadata` permite armazenar campos específicos de cada tipo de
documento (ex: nome do registrado para certidão de nascimento) sem criar dezenas de
colunas opcionais.
