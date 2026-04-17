# Portal Cartorial

> Plataforma web para solicitação e gestão de serviços cartoriais digitais.
> Projeto exemplo da disciplina **Práticas de Engenharia de Software — TADS 2026.1**

[![CI](https://github.com/seu-squad/portal-cartorial/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-squad/portal-cartorial/actions)

---

## Sumário

- [Descrição do sistema](#descrição-do-sistema)
- [Arquitetura — C4 Model](#arquitetura--c4-model)
- [Stack tecnológica](#stack-tecnológica)
- [Como rodar localmente](#como-rodar-localmente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Documentação de decisões arquiteturais](#decisões-arquiteturais-adr)

---

## Descrição do sistema

O **Portal Cartorial** permite que cidadãos solicitem certidões, reconhecimento de firma e
demais serviços cartoriais de forma 100% digital. Atendentes do cartório processam os pedidos
por um backoffice integrado, com autenticação via Gov.br (SSO) e pagamento por gateway externo.

**Usuários:**
| Persona | Descrição |
|---|---|
| Cidadão | Solicita documentos e acompanha pedidos via portal web |
| Atendente | Processa, valida e emite documentos no backoffice |
| Administrador | Gerencia usuários, preços e configurações do sistema |

---

## Arquitetura — C4 Model

### C1 — System Context

```mermaid
graph TD
    cidadao["👤 Cidadão\n(Usuário Web)"]
    atendente["👤 Atendente\n(Backoffice)"]
    admin["👤 Administrador"]

    sistema["🏢 Portal Cartorial\n[Software System]\nPlataforma web de\nserviços cartoriais digitais"]

    govbr["🔐 Gov.br\n[Sistema Externo]\nAutenticação SSO"]
    serpro["🏛️ SERPRO\n[Sistema Externo]\nValidação CPF"]
    pagamento["💳 Gateway Pagamento\n[Sistema Externo]\nCobrança de taxas"]
    email["📧 Serviço de E-mail\n[Sistema Externo]\nNotificações"]

    cidadao -->|Solicita documentos\nvia portal web| sistema
    atendente -->|Processa pedidos\nno backoffice| sistema
    admin -->|Gerencia configurações| sistema

    sistema -->|Autentica usuário\nOAuth2| govbr
    sistema -->|Valida CPF\nREST API| serpro
    sistema -->|Processa pagamento\nREST API| pagamento
    sistema -->|Envia notificações\nSMTP| email
```

### C2 — Container Diagram

```mermaid
graph TD
    cidadao["👤 Cidadão"]
    atendente["👤 Atendente"]

    subgraph portal["Portal Cartorial [Software System]"]
        webapp["🌐 Web App\n[Container: Next.js]\nInterface do cidadão e\natendente (SSR/SPA)"]
        api["⚙️ API Backend\n[Container: NestJS]\nRegras de negócio,\nREST API"]
        auth["🔑 Auth Service\n[Container: Keycloak]\nAutenticação e\nautorização (OAuth2/JWT)"]
        worker["⚡ Worker Service\n[Container: Bull+Redis]\nProcessamento assíncrono\nde documentos"]
        db[("🗄️ Database\n[Container: PostgreSQL]\nDados relacionais")]
        storage[("📁 File Storage\n[Container: MinIO]\nPDFs e documentos\nassinados")]
        cache[("⚡ Cache\n[Container: Redis]\nSessões e filas")]
    end

    govbr["🔐 Gov.br\n[Externo]"]
    pagamento["💳 Gateway\n[Externo]"]

    cidadao -->|HTTPS| webapp
    atendente -->|HTTPS| webapp
    webapp -->|REST/JSON\nHTTPS| api
    api -->|OAuth2\nHTTPS| auth
    api -->|SQL\nTCP 5432| db
    api -->|AMQP\nTCP 6379| worker
    api -->|S3 Protocol\nHTTPS| storage
    api -->|OAuth2\nHTTPS| govbr
    api -->|REST\nHTTPS| pagamento
    worker -->|SQL| db
    worker -->|S3 Protocol| storage
    auth -->|Sessions| cache
    api -->|Cache| cache
```

### C3 — Component Diagram (API Backend)

```mermaid
graph TD
    subgraph api["API Backend [Container: NestJS]"]
        subgraph controllers["Controllers (Camada HTTP)"]
            uc["UsersController\nGET /users\nPATCH /users/:id"]
            dc["DocumentsController\nGET /documents\nPOST /documents"]
            rc["RequestsController\nPOST /requests\nGET /requests/:id"]
            ac["AuthController\nPOST /auth/login\nPOST /auth/refresh"]
        end

        subgraph services["Services (Camada de Negócio)"]
            us["UsersService\nvalidar perfil\ncadastrar cidadão"]
            ds["DocumentsService\ngerar PDF\nvalidar tipo"]
            rs["RequestsService\ncriar pedido\ncalcular taxa\nnotificar"]
            as["AuthService\nvalidar JWT\nrenovar token"]
        end

        subgraph repos["Repositories (Camada de Dados)"]
            ur["UsersRepository\nfindById\nsave\nupdate"]
            dr["DocumentsRepository\nfindByType\nsave"]
            rr["RequestsRepository\nfindByUser\nsave\nupdateStatus"]
        end

        subgraph shared["Shared (Transversal)"]
            jwtg["JwtGuard\nvalida Bearer token"]
            roleg["RolesGuard\nverifica permissão"]
            logint["LoggingInterceptor\nauditoria de requests"]
            valerr["ValidationPipe\nDTO validation"]
        end
    end

    uc --> us
    dc --> ds
    rc --> rs
    ac --> as
    us --> ur
    ds --> dr
    rs --> rr
    rs --> ds
    jwtg --> as
    roleg --> jwtg
```

---

## Stack Tecnológica

| Container | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Web App | Next.js (React) | 14 | SSR para SEO + SPA para interatividade |
| API Backend | NestJS (Node.js) | 10 | Estrutura modular, TypeScript nativo, decorators |
| Auth Service | Keycloak | 23 | OAuth2/OIDC enterprise, integra Gov.br |
| Database | PostgreSQL | 16 | Dados relacionais com ACID + suporte JSON |
| File Storage | MinIO | latest | S3-compatible, self-hosted para LGPD |
| Cache / Queue | Redis | 7 | Filas (Bull) + cache de sessão |
| Worker | Bull (Node.js) | 4 | Processamento assíncrono de PDFs |

---

## Como rodar localmente

### Pré-requisitos
- Docker Desktop 4.x+
- Node.js 20+
- npm 10+

### 1. Clone e configure variáveis de ambiente

```bash
git clone https://github.com/seu-squad/portal-cartorial.git
cd portal-cartorial
cp .env.example .env
# Edite .env com suas configurações locais
```

### 2. Suba a infraestrutura com Docker Compose

```bash
docker compose up -d
# PostgreSQL, Redis, MinIO e Keycloak sobem automaticamente
```

### 3. Instale dependências e rode o backend

```bash
cd backend
npm install
npm run migration:run
npm run seed
npm run start:dev
# API disponível em http://localhost:3000
# Swagger em http://localhost:3000/api/docs
```

### 4. Instale dependências e rode o frontend

```bash
cd frontend
npm install
npm run dev
# App disponível em http://localhost:3001
```

### URLs locais

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3001 |
| API (Swagger) | http://localhost:3000/api/docs |
| Keycloak Admin | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |
| Redis (via RedisInsight) | localhost:6379 |

---

## Estrutura do Projeto

```
portal-cartorial/
├── backend/                    # C2: API Backend [NestJS]
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # C3: Autenticação e autorização
│   │   │   ├── users/          # C3: Gestão de usuários/cidadãos
│   │   │   ├── documents/      # C3: Tipos e templates de documentos
│   │   │   └── requests/       # C3: Pedidos de serviços cartoriais
│   │   ├── shared/             # Guardas, interceptores, pipes globais
│   │   └── config/             # Configuração da aplicação
│   └── test/                   # Testes unitários e de integração
├── frontend/                   # C2: Web App [Next.js]
│   └── src/
│       ├── app/                # Rotas (App Router do Next.js 14)
│       ├── components/         # Componentes reutilizáveis
│       ├── hooks/              # Custom React Hooks
│       ├── services/           # Clients da API
│       └── types/              # Tipos TypeScript compartilhados
├── docs/
│   └── architecture/
│       ├── decisions/          # ADRs (Architecture Decision Records)
│       └── images/             # Diagramas exportados
├── infra/                      # Docker, scripts de banco
├── .github/workflows/          # Pipelines CI/CD
├── docker-compose.yml          # C2: todos os containers
└── .env.example
```

---

## Decisões Arquiteturais (ADR)

| # | Decisão | Status |
|---|---|---|
| [ADR-001](docs/architecture/decisions/ADR-001-nextjs-ssr.md) | Usar Next.js com SSR | Aceito |
| [ADR-002](docs/architecture/decisions/ADR-002-nestjs-backend.md) | Usar NestJS para API | Aceito |
| [ADR-003](docs/architecture/decisions/ADR-003-postgresql-database.md) | PostgreSQL vs MongoDB | Aceito |
| [ADR-004](docs/architecture/decisions/ADR-004-keycloak-auth.md) | Keycloak para autenticação | Aceito |

---

*Prof. Marcio Goes do Nascimento — Práticas de Engenharia de Software · TADS 2026.1*
