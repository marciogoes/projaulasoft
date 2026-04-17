# Arquitetura — Pharmacy Microservices

Documento de referência arquitetural do sistema, seguindo o **C4 Model** (Context → Container → Component → Code).

---

## 1. System Context (Nível 1)

> **Quem** usa o sistema e com **quais** sistemas externos ele interage.

```
                ┌────────────────────┐
                │   Atendente /      │
                │   Farmacêutico     │
                └─────────┬──────────┘
                          │ usa
                          ▼
           ╔══════════════════════════════╗
           ║   Pharmacy Microservices     ║
           ║   (Sistema de gestão de      ║
           ║    estoque da farmácia)      ║
           ╚══════════════════════════════╝
                          │
                          │ (futuro: fornecedor,
                          │  sistema fiscal, etc.)
                          ▼
                [Sistemas Externos]
```

**Atores:**
- **Atendente** — registra vendas no balcão
- **Farmacêutico/Gerente** — gerencia cadastro e estoque

**Sistemas externos (não implementados — oportunidade para evolução):**
- Sistema fiscal (emissão de NFC-e)
- ERP do fornecedor
- Convênios (planos de saúde)

---

## 2. Container (Nível 2)

> Os **containers** (aplicações/serviços) que compõem o sistema.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Pharmacy Microservices                       │
│                                                                 │
│   ┌──────────────┐                                              │
│   │ API Gateway  │  :8000  (FastAPI + httpx)                    │
│   │              │  Roteia /api/* para os serviços              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          │ HTTP/REST                                            │
│   ┌──────┴─────────────────────────────────────┐                │
│   ▼              ▼                    ▼                         │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐                 │
│  │ Product  │  │  Inventory   │  │   Sales    │                 │
│  │ Service  │  │   Service    │  │  Service   │                 │
│  │ :8001    │  │   :8002      │  │   :8003    │                 │
│  │ FastAPI  │  │   FastAPI    │  │   FastAPI  │                 │
│  └────┬─────┘  └──────┬───────┘  └──────┬─────┘                 │
│       │               │                 │                       │
│       ▼               ▼                 ▼                       │
│   ┌───────┐       ┌─────────┐       ┌────────┐                  │
│   │SQLite │       │ SQLite  │       │ SQLite │                  │
│   │products│      │inventory│       │ sales  │                  │
│   └───────┘       └─────────┘       └────────┘                  │
│                                                                 │
│   Comunicação:                                                  │
│     ──▶ REST síncrono (gateway → serviços, sales → product)     │
│     ══▶ Eventos HTTP (sales → inventory via /events/...)        │
└─────────────────────────────────────────────────────────────────┘
```

### Detalhamento de cada container

| Container | Tecnologia | Porta | Banco | Responsabilidade |
|-----------|------------|-------|-------|------------------|
| api-gateway | Python 3.11 + FastAPI + httpx async | 8000 | — | Roteamento e health agregado |
| product-service | Python 3.11 + FastAPI + SQLAlchemy | 8001 | SQLite (`products.db`) | Catálogo de medicamentos |
| inventory-service | Python 3.11 + FastAPI + SQLAlchemy | 8002 | SQLite (`inventory.db`) | Estoque + movimentos |
| sales-service | Python 3.11 + FastAPI + SQLAlchemy | 8003 | SQLite (`sales.db`) | Vendas + orquestração |

### Por que "database per service"?
Cada serviço é dono do seu esquema. Consequências:
- ✅ **Independência** — posso trocar o banco de um sem afetar os outros
- ✅ **Deploy independente** — migrations não são compartilhadas
- ❌ **Sem JOIN** entre serviços — precisa de chamadas HTTP ou replicação de dados
- ❌ **Consistência eventual** — não há transação distribuída trivial

---

## 3. Component (Nível 3) — Exemplo: inventory-service

> Os **componentes internos** de um container.

```
┌──────────────────── inventory-service ────────────────────┐
│                                                           │
│  ┌────────────────────┐                                   │
│  │   main.py          │  ← Entrypoint FastAPI             │
│  └──────────┬─────────┘                                   │
│             │ inclui                                      │
│             ▼                                             │
│  ┌────────────────────┐                                   │
│  │   routes.py        │  ← Endpoints /inventory, /events  │
│  └──────────┬─────────┘                                   │
│             │ chama                                       │
│             ▼                                             │
│  ┌────────────────────┐       ┌────────────────────┐      │
│  │   crud.py          │       │ product_client.py  │      │
│  │   (regras estoque) │       │ (HTTP → product)   │      │
│  └──────────┬─────────┘       └─────────┬──────────┘      │
│             │ usa                       │ consome         │
│             ▼                           ▼                 │
│  ┌────────────────────┐       ┌────────────────────┐      │
│  │   models.py        │       │  schemas.py        │      │
│  │   (ORM)            │       │  (Pydantic DTOs)   │      │
│  └──────────┬─────────┘       └────────────────────┘      │
│             │                                             │
│             ▼                                             │
│  ┌────────────────────┐                                   │
│  │   database.py      │  ← Engine + Session + get_db()    │
│  └──────────┬─────────┘                                   │
│             │                                             │
│             ▼                                             │
│         [SQLite]                                          │
└───────────────────────────────────────────────────────────┘
```

### Responsabilidades por arquivo

| Arquivo | Função |
|---------|--------|
| `main.py` | Configura FastAPI e inclui routers |
| `routes.py` | Valida entrada HTTP e delega ao crud |
| `crud.py` | Lógica de negócio + queries |
| `models.py` | Mapeamento ORM (SQLAlchemy) |
| `schemas.py` | DTOs Pydantic (validação) |
| `database.py` | Conexão + sessão do banco |
| `product_client.py` | Adapter HTTP para outro serviço |

Os demais serviços seguem a mesma organização.

---

## 4. Padrões e Decisões Arquiteturais (ADRs)

### ADR 001 — Comunicação síncrona vs. assíncrona
**Decisão:** mistura — REST síncrono para validações críticas (antes de criar venda) e eventos HTTP para efeitos colaterais (baixa de estoque após venda).

**Motivação didática:** mostrar ambos os estilos sem introduzir complexidade de broker (RabbitMQ/Kafka).

**Trade-offs:**
- Eventos via HTTP são frágeis (perda silenciosa). Em produção → broker com retry.
- Síncrono tudo gera acoplamento temporal (serviço A parado derruba venda).

### ADR 002 — SQLite em cada serviço
**Decisão:** usar SQLite no contexto didático; em produção, PostgreSQL/MySQL.

**Motivação:** zero configuração, facilita onboarding dos alunos.

**Limitação:** SQLite não suporta escrita concorrente pesada. Para prod, trocar URL no `.env`.

### ADR 003 — SAGA orquestrada no sales-service
**Decisão:** o sales-service é o coordenador da transação distribuída:
1. Busca preço (product)
2. Verifica estoque (inventory)
3. Grava venda
4. Publica evento

**Alternativa:** coreografia pura (cada serviço reage a eventos sem coordenador).
**Escolhemos orquestração** porque é mais fácil de entender e debugar num contexto didático.

### ADR 004 — Autenticação ausente (proposital)
**Decisão:** não implementar JWT/OAuth no ponto de partida.

**Motivação:** reduzir complexidade inicial. **Exercício sugerido para os alunos:** adicionar autenticação no gateway.

---

## 5. Fluxo ponta a ponta — "Registrar uma venda"

```
 Cliente                                                                             
    │                                                                                
    │  POST /api/sales                                                                      
    │  {itens: [{produto_id:1, quantidade:2}]}                                       
    ▼                                                                                
 ┌─────────────┐                                                                     
 │   Gateway   │                                                                     
 │   :8000     │──── roteia ────▶ POST /sales                                        
 └─────────────┘                                                                     
                                         │                                           
                                         ▼                                           
                                 ┌───────────────┐                                   
                                 │ sales-service │                                   
                                 └───────┬───────┘                                   
                      ┌──────────────────┤                                           
                      │ 1. GET /products/1        2. GET /inventory/stock/1         
                      ▼                                 ▼                            
              ┌───────────────┐                  ┌───────────────────┐                
              │ product-svc   │                  │ inventory-service │                
              └───────────────┘                  └───────────────────┘                
                                         │                                           
                                         ▼                                           
                                 3. Grava venda (sales.db)                           
                                         │                                           
                                         ▼                                           
                          4. POST /events/sale-created                                
                                         │                                           
                                         ▼                                           
                                ┌───────────────────┐                                 
                                │ inventory-service │ ← dá baixa no estoque          
                                └───────────────────┘                                 
                                         │                                           
                                         ▼                                           
                                   201 Created                                       
```

---

## 6. Qualidades não-funcionais

| Atributo | Como é tratado |
|----------|----------------|
| **Disponibilidade** | Healthcheck por serviço; gateway retorna 503 se downstream cair |
| **Observabilidade** | Endpoint `/health` em cada serviço; logs via `print` (didático) |
| **Escalabilidade** | Cada serviço pode ser replicado independentemente (stateless, com DB isolado) |
| **Testabilidade** | SQLite `:memory:` + mocks HTTP via monkeypatch |
| **Deploy** | Dockerfile por serviço + docker-compose |
| **Segurança** | ⚠️ Ausente propositalmente — exercício para alunos |

---

## 7. Evoluções sugeridas (exercícios para alunos)

| # | Evolução | Aula correlata |
|---|----------|----------------|
| 1 | Autenticação JWT no gateway | DevOps / Segurança |
| 2 | Trocar eventos HTTP por RabbitMQ | Arquitetura II (microsserviços) |
| 3 | Adicionar Prometheus + Grafana | Monitoramento e Logs |
| 4 | Circuit breaker (tenacity/pybreaker) | Qualidade e Testes |
| 5 | Alembic para migrations | Gestão de configuração |
| 6 | Testes de contrato (Pact) | Qualidade e Testes |
| 7 | Novo serviço `notification-service` (email/SMS ao gerar estoque baixo) | Arquitetura II |
| 8 | Substituir SQLite por PostgreSQL | DevOps |

---

## 📚 Referências
- [C4 Model](https://c4model.com/)
- Newman, Sam. *Building Microservices*. 2nd ed., O'Reilly, 2021.
- Richardson, Chris. *Microservices Patterns*. Manning, 2018.
- [12-Factor App](https://12factor.net/pt_br/)
