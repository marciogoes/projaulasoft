# 💊 Pharmacy Microservices — Sistema de Controle de Estoque

> **Projeto didático** para a disciplina **TEADS0354 — Práticas de Engenharia de Software**
> Exemplo de referência para os projetos dos alunos do curso TADS/UFPA.

Sistema distribuído de controle de estoque de farmácia construído em **Python + FastAPI**, seguindo o padrão de **microserviços** com **database per service**, comunicação **REST + eventos**, containerização com **Docker** e pipeline **CI/CD** com **GitHub Actions**.

---

## 🎯 Objetivos Pedagógicos

Este projeto ilustra na prática os seguintes conceitos abordados na disciplina:

| Aula | Tópico | Onde ver no projeto |
|------|--------|---------------------|
| 04–05 | Arquitetura de Software (C4, Microserviços) | [`docs/architecture.md`](docs/architecture.md) |
| 03 | Gestão de Configuração (Gitflow, conventional commits) | `.gitignore`, histórico git |
| 07–08 | Qualidade e Testes (pirâmide de testes, TDD) | `services/*/tests/` |
| 09 | Cultura DevOps e Docker | `Dockerfile`, `docker-compose.yml` |
| 10 | Integração Contínua (CI) | `.github/workflows/ci.yml` |
| 11 | Entrega Contínua (CD) | `docker-compose.yml`, estratégia documentada |
| 12 | Monitoramento e Logs | Endpoints `/health` em cada serviço |

---

## 🏗️ Arquitetura

```
                    ┌─────────────────┐
                    │   API Gateway   │  :8000
                    │   (FastAPI)     │
                    └────────┬────────┘
                             │ REST
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │   Product    │   │   Inventory  │   │    Sales     │
  │   Service    │◄──┤   Service    │◄──┤   Service    │
  │   :8001      │   │   :8002      │   │    :8003     │
  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
         │                  │                  │
         ▼                  ▼                  ▼
     products.db      inventory.db         sales.db
     (SQLite)         (SQLite)             (SQLite)

         ▲                  ▲
         │                  │
         └──── Eventos ─────┘
              (HTTP POST p/ /events)
```

Para detalhes completos incluindo diagramas **C4 Model**, veja [`docs/architecture.md`](docs/architecture.md).

---

## 📦 Serviços

| Serviço | Porta | Responsabilidade | Banco |
|---------|-------|------------------|-------|
| **api-gateway** | 8000 | Ponto único de entrada, roteamento | — |
| **product-service** | 8001 | CRUD de medicamentos (catálogo) | `products.db` |
| **inventory-service** | 8002 | Estoque, movimentações, alertas | `inventory.db` |
| **sales-service** | 8003 | Registro de vendas, orquestração | `sales.db` |

Cada serviço expõe **documentação Swagger** automática em `http://localhost:<porta>/docs`.

---

## 🚀 Como Executar

### Pré-requisitos
- Python 3.11+
- Docker e Docker Compose
- Make (opcional, facilita os comandos)

### Opção 1 — Docker Compose (recomendado)

```bash
# Sobe todos os serviços
docker-compose up --build

# Em outro terminal, popula dados de exemplo
make seed
# ou: python scripts/seed_data.py
```

Acesse:
- **Gateway:** http://localhost:8000/docs
- **Product Service:** http://localhost:8001/docs
- **Inventory Service:** http://localhost:8002/docs
- **Sales Service:** http://localhost:8003/docs

### Opção 2 — Execução local (para desenvolvimento)

```bash
# Instala dependências de todos os serviços
make install

# Sobe todos os serviços em paralelo
make run-local

# Em outro terminal
make seed
```

### Opção 3 — Serviço isolado

```bash
cd services/product-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

---

## 🧪 Testes

```bash
# Roda todos os testes
make test

# Testa apenas um serviço
cd services/product-service
pytest -v

# Com cobertura
pytest --cov=app --cov-report=term-missing
```

---

## 📝 Exemplos de Uso

### Cadastrar um medicamento
```bash
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Dipirona 500mg",
    "codigo_barras": "7891234567890",
    "fabricante": "EMS",
    "preco": 12.50,
    "requer_receita": false
  }'
```

### Dar entrada em estoque
```bash
curl -X POST http://localhost:8000/api/inventory/movements \
  -H "Content-Type: application/json" \
  -d '{
    "produto_id": 1,
    "tipo": "ENTRADA",
    "quantidade": 100,
    "observacao": "Compra fornecedor A"
  }'
```

### Registrar uma venda
```bash
curl -X POST http://localhost:8000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "itens": [
      {"produto_id": 1, "quantidade": 2}
    ],
    "cliente": "João Silva"
  }'
```

Veja mais exemplos em [`docs/api-examples.md`](docs/api-examples.md).

---

## 🎓 Para os Alunos — Como Usar Este Projeto

Este projeto é um **ponto de partida**. Sugestões de exercícios e evoluções:

### Exercícios práticos
1. **Adicionar um novo serviço** (ex: `notification-service` que consome eventos `stock.low`)
2. **Implementar autenticação** (JWT no gateway)
3. **Substituir SQLite por PostgreSQL** em um dos serviços
4. **Adicionar cache** com Redis no product-service
5. **Trocar eventos HTTP por RabbitMQ** (evolução arquitetural real)
6. **Implementar testes de contrato** entre serviços (Pact)
7. **Adicionar observabilidade** (Prometheus + Grafana)

### Projetos sugeridos baseados nesta base
- Sistema de gestão hospitalar (ampliação do domínio)
- E-commerce de farmácia (adicionar pagamento, entrega)
- ERP para pequeno comércio (adaptar domínio)

> **Importante:** Lembre-se do princípio da disciplina — **projetos devem resolver problemas reais**, não ser CRUDs genéricos.

---

## 📚 Estrutura de Diretórios

```
pharmacy-microservices/
├── services/                    # Microserviços
│   ├── product-service/         # Catálogo de medicamentos
│   ├── inventory-service/       # Controle de estoque
│   ├── sales-service/           # Registro de vendas
│   └── api-gateway/             # Ponto único de entrada
├── docs/                        # Documentação
│   ├── architecture.md          # C4 Model, decisões arquiteturais
│   └── api-examples.md          # Exemplos de requisições
├── scripts/                     # Scripts auxiliares
│   ├── seed_data.py             # Popula dados de exemplo
│   └── run_local.sh             # Sobe serviços local
├── .github/workflows/           # CI/CD
│   └── ci.yml                   # Pipeline GitHub Actions
├── docker-compose.yml           # Orquestração dos serviços
├── Makefile                     # Comandos comuns
└── README.md                    # Este arquivo
```

---

## 🛠️ Stack Técnica

- **Linguagem:** Python 3.11
- **Framework web:** FastAPI
- **ORM:** SQLAlchemy 2.0
- **Validação:** Pydantic v2
- **Banco de dados:** SQLite (didático; em produção usar PostgreSQL)
- **HTTP client:** httpx
- **Testes:** pytest + pytest-asyncio + httpx
- **Container:** Docker + docker-compose
- **CI:** GitHub Actions

---

## 📖 Referências

- Newman, Sam. *Building Microservices*. O'Reilly, 2021.
- Martin, Robert C. *Arquitetura Limpa*. Alta Books, 2018.
- Kim, Gene et al. *Manual de DevOps*. Alta Books, 2018.
- [C4 Model](https://c4model.com/)
- [12-Factor App](https://12factor.net/pt_br/)

---

## 📝 Licença

Material didático — UFPA/TADS 2026.1 — Prof. Marcio Goes do Nascimento
Uso livre para fins educacionais.
