# ADR-002 — Usar NestJS para o API Backend

**Data:** 2026-02-13
**Status:** Aceito
**Decisores:** Squad Portal Cartorial

---

## Contexto

Precisamos de um backend REST que suporte TypeScript nativo, organize o código em
módulos coesos (Auth, Users, Documents, Requests), integre facilmente com Keycloak
(OAuth2/JWT), suporte Bull para filas assíncronas e exponha documentação Swagger
automática.

## Decisão

Adotaremos **NestJS 10** como framework de backend.

## Alternativas Consideradas

| Alternativa | Prós | Contras | Motivo da Rejeição |
|---|---|---|---|
| **Express.js puro** | Simples, flexível | Sem estrutura forçada, TS manual | Falta de convenções |
| **Fastify** | Alta performance | Ecossistema menor | Plugins necessários |
| **Spring Boot (Java)** | Maduro, corporativo | Outro ecossistema | Time já conhece Node.js |
| **NestJS 10** ✅ | Modular, TypeScript nativo, decorators, Swagger automático | Overhead inicial de boilerplate | **Escolhido** |

## Consequências

**Positivo:**
- Estrutura modular espelha o diagrama C3: cada módulo é um componente
- Decorators (`@Controller`, `@UseGuards`, `@ApiBearerAuth`) reduzem boilerplate
- Swagger gerado automaticamente dos DTOs com `@nestjs/swagger`
- `PassportStrategy` facilita JWT + Keycloak OAuth2

**Negativo:**
- Mais opinionado que Express → menos flexibilidade pontual
- Boilerplate inicial maior (module/controller/service/dto para cada recurso)

## Mapeamento C3 → NestJS

```
C3 Component          NestJS Artefato
──────────────────────────────────────
AuthService      →    modules/auth/auth.service.ts
RequestsService  →    modules/requests/requests.service.ts
JwtGuard         →    shared/guards/jwt-auth.guard.ts
LoggingInterceptor → shared/interceptors/logging.interceptor.ts
```
