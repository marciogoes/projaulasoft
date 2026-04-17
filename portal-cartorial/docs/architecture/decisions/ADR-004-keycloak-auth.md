# ADR-004 — Keycloak para autenticação e autorização

**Data:** 2026-02-13
**Status:** Aceito
**Decisores:** Squad Portal Cartorial

---

## Contexto

O Portal Cartorial precisa integrar com Gov.br (SSO nacional) para autenticação de
cidadãos, controlar acesso por roles (cidadao, atendente, admin) e emitir JWTs para
as APIs. O sistema é de natureza governamental e requer auditoria de acessos.

## Decisão

Adotaremos **Keycloak 23** como Auth Service (C2 Container), rodando como serviço
independente e integrado ao Gov.br via OpenID Connect.

## Alternativas Consideradas

| Alternativa | Prós | Contras | Motivo da Rejeição |
|---|---|---|---|
| **Auth0** | Managed, fácil setup | Custo, dados fora do Brasil (LGPD) | LGPD: dados devem ficar no Brasil |
| **NextAuth apenas** | Simples, integrado ao Next.js | Não escalável para múltiplos serviços | Múltiplos backends no futuro |
| **JWT manual** | Controle total | Reinventar a roda, sem admin UI | Complexidade desnecessária |
| **Keycloak 23** ✅ | Self-hosted, LGPD, Gov.br nativo, admin UI, auditoria | Setup inicial mais complexo | **Escolhido** |

## Consequências

**Positivo:**
- Dados de autenticação ficam no Brasil (self-hosted) → conformidade LGPD
- Interface admin para gestão de usuários e roles sem código
- Integração nativa com Gov.br via OpenID Connect federation
- JWTs com claims customizados para roles

**Negativo:**
- Serviço adicional para manter (Docker container)
- Curva de aprendizado para configuração de realms e clients

## Configuração de Roles

```
Realm: cartorial
│
├── Client: portal-api (confidential, para o NestJS)
│   └── Roles: ADMIN_ACCESS, SERVICE_ACCESS
│
└── Client: portal-web (public, para o Next.js)
    └── Scopes: openid, profile, email, roles

Realm Roles:
  - cidadao    → acesso à área do cidadão
  - atendente  → acesso ao backoffice
  - admin      → acesso total + configuração
```

## Fluxo de Autenticação

```
Cidadão → Next.js → Keycloak → Gov.br (OpenID Connect)
                  ↓
              JWT com roles
                  ↓
              NestJS API (valida JWT)
```
